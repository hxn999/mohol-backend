import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { sql } from 'kysely';

@Injectable()
export class AnalyticsService {
    constructor(private readonly db: DatabaseService) { }

    async getDashboard(): Promise<any> {
        // 1. Total Users
        const totalUsersRes = await sql<any>`SELECT COUNT(*)::int as count FROM users`.execute(this.db);

        // 2. New Signups
        const signupsToday = await sql<any>`SELECT COUNT(*)::int as count FROM users WHERE created_at >= CURRENT_DATE`.execute(this.db);
        const signupsWeek = await sql<any>`SELECT COUNT(*)::int as count FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`.execute(this.db);
        const signupsMonth = await sql<any>`SELECT COUNT(*)::int as count FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`.execute(this.db);

        // 3. Active Users (approximation: users who liked, commented, or posted)
        const dauRes = await sql<any>`
            SELECT COUNT(DISTINCT user_id)::int as count FROM (
                SELECT user_id FROM post WHERE created_at >= CURRENT_DATE
                UNION SELECT user_id FROM comment WHERE created_at >= CURRENT_DATE
                UNION SELECT user_id FROM likes_post WHERE created_at >= CURRENT_DATE
            ) active
        `.execute(this.db);
        const wauRes = await sql<any>`
            SELECT COUNT(DISTINCT user_id)::int as count FROM (
                SELECT user_id FROM post WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                UNION SELECT user_id FROM comment WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                UNION SELECT user_id FROM likes_post WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            ) active
        `.execute(this.db);
        const mauRes = await sql<any>`
            SELECT COUNT(DISTINCT user_id)::int as count FROM (
                SELECT user_id FROM post WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                UNION SELECT user_id FROM comment WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                UNION SELECT user_id FROM likes_post WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            ) active
        `.execute(this.db);

        // 4. Total Posts
        const totalPostsRes = await sql<any>`SELECT COUNT(*)::int as count FROM post WHERE status = 'active'`.execute(this.db);
        const postsToday = await sql<any>`SELECT COUNT(*)::int as count FROM post WHERE created_at >= CURRENT_DATE AND status = 'active'`.execute(this.db);
        const postsWeek = await sql<any>`SELECT COUNT(*)::int as count FROM post WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active'`.execute(this.db);

        // 5. Engagement
        const totalLikes = await sql<any>`SELECT COUNT(*)::int as count FROM likes_post`.execute(this.db);
        const totalComments = await sql<any>`SELECT COUNT(*)::int as count FROM comment`.execute(this.db);
        const totalShares = await sql<any>`SELECT COUNT(*)::int as count FROM shares`.execute(this.db);
        const totalPostCount = totalPostsRes.rows[0]?.count || 1;
        const engagementRate = ((totalLikes.rows[0]?.count || 0) + (totalComments.rows[0]?.count || 0) + (totalShares.rows[0]?.count || 0)) / Math.max(totalPostCount, 1);

        // 6. Posts per day (last 14 days)
        const postsPerDay = await sql<any>`
            SELECT 
                DATE(created_at) as date,
                COUNT(*)::int as count
            FROM post 
            WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' 
              AND status = 'active'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `.execute(this.db);

        // 7. User signups per day (last 14 days)
        const signupsPerDay = await sql<any>`
            SELECT 
                DATE(created_at) as date,
                COUNT(*)::int as count
            FROM users
            WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `.execute(this.db);

        // 8. Top Performing Posts
        const topPosts = await sql<any>`
            SELECT 
                p.id,
                LEFT(p.body, 80) as body_preview,
                p.type,
                p.created_at,
                u.id as user_id,
                u.full_name,
                u.username,
                u.profile_pic_id,
                (SELECT COUNT(*)::int FROM likes_post WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*)::int FROM comment WHERE post_id = p.id) as comments_count,
                (SELECT COUNT(*)::int FROM shares WHERE post_id = p.id) as shares_count,
                (SELECT COUNT(*)::int FROM likes_post WHERE post_id = p.id) + 
                (SELECT COUNT(*)::int FROM comment WHERE post_id = p.id) + 
                (SELECT COUNT(*)::int FROM shares WHERE post_id = p.id) as total_engagement
            FROM post p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'active'
            ORDER BY total_engagement DESC
            LIMIT 10
        `.execute(this.db);

        // 9. Top Active Users / Creators
        const topCreators = await sql<any>`
            SELECT 
                u.id,
                u.full_name,
                u.username,
                u.profile_pic_id,
                (SELECT COUNT(*)::int FROM post WHERE user_id = u.id AND status = 'active') as posts_count,
                (SELECT COUNT(*)::int FROM likes_post lp JOIN post p ON lp.post_id = p.id WHERE p.user_id = u.id) as likes_received,
                (SELECT COUNT(*)::int FROM comment c JOIN post p ON c.post_id = p.id WHERE p.user_id = u.id AND c.user_id != u.id) as comments_received,
                (SELECT COUNT(*)::int FROM follow WHERE following_id = u.id) as followers_count,
                (SELECT COUNT(*)::int FROM post WHERE user_id = u.id AND status = 'active') +
                (SELECT COUNT(*)::int FROM likes_post lp JOIN post p ON lp.post_id = p.id WHERE p.user_id = u.id) +
                (SELECT COUNT(*)::int FROM comment c JOIN post p ON c.post_id = p.id WHERE p.user_id = u.id AND c.user_id != u.id) as activity_score
            FROM users u
            ORDER BY activity_score DESC
            LIMIT 10
        `.execute(this.db);

        // 10. Platform totals
        const totalGroups = await sql<any>`SELECT COUNT(*)::int as count FROM groups`.execute(this.db);
        const totalFriendships = await sql<any>`SELECT COUNT(*)::int as count FROM friend WHERE status = 'accepted'`.execute(this.db);
        const totalFollows = await sql<any>`SELECT COUNT(*)::int as count FROM follow`.execute(this.db);

        return {
            totalUsers: totalUsersRes.rows[0]?.count || 0,
            signups: {
                today: signupsToday.rows[0]?.count || 0,
                thisWeek: signupsWeek.rows[0]?.count || 0,
                thisMonth: signupsMonth.rows[0]?.count || 0,
                perDay: signupsPerDay.rows,
            },
            activeUsers: {
                dau: dauRes.rows[0]?.count || 0,
                wau: wauRes.rows[0]?.count || 0,
                mau: mauRes.rows[0]?.count || 0,
            },
            posts: {
                total: totalPostsRes.rows[0]?.count || 0,
                today: postsToday.rows[0]?.count || 0,
                thisWeek: postsWeek.rows[0]?.count || 0,
                perDay: postsPerDay.rows,
            },
            engagement: {
                totalLikes: totalLikes.rows[0]?.count || 0,
                totalComments: totalComments.rows[0]?.count || 0,
                totalShares: totalShares.rows[0]?.count || 0,
                rate: Math.round(engagementRate * 10) / 10,
            },
            topPosts: topPosts.rows,
            topCreators: topCreators.rows,
            platform: {
                totalGroups: totalGroups.rows[0]?.count || 0,
                totalFriendships: totalFriendships.rows[0]?.count || 0,
                totalFollows: totalFollows.rows[0]?.count || 0,
            }
        };
    }
}
