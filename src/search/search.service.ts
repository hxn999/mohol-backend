import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { sql } from 'kysely';

@Injectable()
export class SearchService {
    constructor(private readonly db: DatabaseService) { }

    async searchAll(query: string, userId: number) {
        const q = `%${query}%`;

        const [users, groups, posts] = await Promise.all([
            this.searchUsers(q),
            this.searchGroups(q, userId),
            this.searchPosts(q, userId)
        ]);

        return { users, groups, posts };
    }

    async getSuggestions(query: string) {
        const q = `%${query}%`;

        // Suggestions typically return names/titles for autocomplete
        const [users, groups] = await Promise.all([
            sql<any>`
                SELECT id, username, full_name, 'user' as type
                FROM users 
                WHERE username ILIKE ${q} OR full_name ILIKE ${q}
                LIMIT 5
            `.execute(this.db),
            sql<any>`
                SELECT id, title, 'group' as type
                FROM groups 
                WHERE title ILIKE ${q}
                LIMIT 5
            `.execute(this.db)
        ]);

        return [...users.rows, ...groups.rows];
    }

    private async searchUsers(q: string) {
        const result = await sql<any>`
            SELECT id, username, full_name, profile_pic_id, bio
            FROM users 
            WHERE username ILIKE ${q} OR full_name ILIKE ${q}
            LIMIT 20
        `.execute(this.db);
        return result.rows;
    }

    private async searchGroups(q: string, userId: number) {
        const result = await sql<any>`
            SELECT g.*, 
                (SELECT COUNT(*) FROM membership m2 WHERE m2.group_id = g.id) as member_count,
                (SELECT role FROM membership m3 WHERE m3.group_id = g.id AND m3.user_id = ${userId}) as user_role
            FROM groups g
            LEFT JOIN membership m ON m.group_id = g.id AND m.user_id = ${userId}
            WHERE (g.title ILIKE ${q} OR g.description ILIKE ${q})
              AND (g.visibility = 'public' OR m.user_id IS NOT NULL)
            LIMIT 20
        `.execute(this.db);
        return result.rows;
    }

    private async searchPosts(q: string, userId: number) {
        const result = await sql<any>`
            WITH user_friends AS (
                SELECT 
                    CASE WHEN user_id = ${userId} THEN friend_id ELSE user_id END AS friend_id
                FROM friend
                WHERE (user_id = ${userId} OR friend_id = ${userId}) 
                  AND status = 'accepted'
            ),
            user_groups AS (
                SELECT group_id FROM membership WHERE user_id = ${userId}
            )
            SELECT p.*, u.username, u.full_name, u.profile_pic_id
            FROM post p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN user_friends uf ON p.user_id = uf.friend_id
            WHERE p.status = 'active'
              AND p.body ILIKE ${q}
              AND (
                  p.visibility = 'public'
                  OR p.user_id = ${userId}
                  OR (p.visibility = 'friends_only' AND uf.friend_id IS NOT NULL)
                  OR (p.visibility = 'group_only' AND p.group_id IN (SELECT group_id FROM user_groups))
              )
            ORDER BY p.created_at DESC
            LIMIT 20
        `.execute(this.db);
        return result.rows;
    }
}
