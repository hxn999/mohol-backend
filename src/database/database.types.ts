// Kysely database types for PostgreSQL schema
import { Generated, Insertable, Selectable, Updateable } from 'kysely';

// ============================================
// ENUM TYPES (matching PostgreSQL enums)
// ============================================

export type UserRole = 'user' | 'admin' | 'moderator';
export type PostType = 'text' | 'image' | 'video' | 'share';
export type PostVisibility = 'public' | 'private' | 'friends_only' | 'group_only';
export type PostStatus = 'active' | 'archived' | 'deleted' | 'pending';
export type GroupVisibility = 'public' | 'private' | 'hidden';
export type MembershipRole = 'member' | 'admin' | 'moderator' | 'owner';
export type NotificationType = 'like' | 'comment' | 'follow' | 'friend_request' | 'mention' | 'group_invite' | 'post_share';
export type NotificationRefType = 'post' | 'comment' | 'user' | 'group';
export type ImageType = 'profile' | 'cover' | 'post' | 'comment' | 'group_cover';
export type FriendStatus = 'pending' | 'accepted' | 'rejected';

// ============================================
// TABLE INTERFACES
// ============================================

export interface UsersTable {
  id: Generated<number>;
  username: string;
  password: string;
  full_name: string;
  email: string;
  profile_pic_id: number | null;
  cover_pic_id: number | null;
  bio: string | null;
  role: UserRole;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ImageTable {
  id: Generated<number>;
  url: string;
  post_id: number | null;
  user_id: number | null;
  type: ImageType;
  created_at: Generated<Date>;
}

export interface GroupsTable {
  id: Generated<number>;
  title: string;
  description: string | null;
  cover_img_id: number | null;
  visibility: GroupVisibility;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface NotificationTable {
  id: Generated<number>;
  user_id: number;
  message: string;
  type: NotificationType;
  ref_id: number | null;
  ref_type: NotificationRefType | null;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface PostTable {
  id: Generated<number>;
  body: string | null;
  user_id: number;
  group_id: number | null;
  original_post_id: number | null;
  type: PostType;
  visibility: PostVisibility;
  status: PostStatus;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CommentTable {
  id: Generated<number>;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  comment: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface BlockTable {
  id: Generated<number>;
  blocker_id: number;
  blocked_id: number;
  created_at: Generated<Date>;
}

export interface FollowTable {
  id: Generated<number>;
  follower_id: number;
  following_id: number;
  created_at: Generated<Date>;
}

export interface FriendTable {
  id: Generated<number>;
  user_id: number;
  friend_id: number;
  status: FriendStatus;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MembershipTable {
  id: Generated<number>;
  user_id: number;
  group_id: number;
  role: MembershipRole;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface LikesPostTable {
  id: Generated<number>;
  user_id: number;
  post_id: number;
  created_at: Generated<Date>;
}

export interface LikesCommentTable {
  id: Generated<number>;
  user_id: number;
  comment_id: number;
  created_at: Generated<Date>;
}

export interface SharesTable {
  id: Generated<number>;
  user_id: number;
  post_id: number;
  created_at: Generated<Date>;
}

export interface TagsPostTable {
  id: Generated<number>;
  post_id: number;
  user_id: number;
  created_at: Generated<Date>;
}

export interface TagsImageTable {
  id: Generated<number>;
  image_id: number;
  user_id: number;
  created_at: Generated<Date>;
}

export interface RefreshTokenTable {
  id: Generated<number>;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked: Generated<boolean>;
  created_at: Generated<Date>;
}

// ============================================
// DATABASE INTERFACE
// ============================================

export interface DB {
  users: UsersTable;
  image: ImageTable;
  groups: GroupsTable;
  notification: NotificationTable;
  post: PostTable;
  comment: CommentTable;
  block: BlockTable;
  follow: FollowTable;
  friend: FriendTable;
  membership: MembershipTable;
  likes_post: LikesPostTable;
  likes_comment: LikesCommentTable;
  shares: SharesTable;
  tags_post: TagsPostTable;
  tags_image: TagsImageTable;
  refresh_token: RefreshTokenTable;
}

// ============================================
// TYPE HELPERS (for CRUD operations)
// ============================================

// Users
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// Image
export type Image = Selectable<ImageTable>;
export type NewImage = Insertable<ImageTable>;
export type ImageUpdate = Updateable<ImageTable>;

// Groups
export type Group = Selectable<GroupsTable>;
export type NewGroup = Insertable<GroupsTable>;
export type GroupUpdate = Updateable<GroupsTable>;

// Notification
export type Notification = Selectable<NotificationTable>;
export type NewNotification = Insertable<NotificationTable>;
export type NotificationUpdate = Updateable<NotificationTable>;

// Post
export type Post = Selectable<PostTable>;
export type NewPost = Insertable<PostTable>;
export type PostUpdate = Updateable<PostTable>;

// Comment
export type Comment = Selectable<CommentTable>;
export type NewComment = Insertable<CommentTable>;
export type CommentUpdate = Updateable<CommentTable>;

// Block
export type Block = Selectable<BlockTable>;
export type NewBlock = Insertable<BlockTable>;

// Follow
export type Follow = Selectable<FollowTable>;
export type NewFollow = Insertable<FollowTable>;

// Friend
export type Friend = Selectable<FriendTable>;
export type NewFriend = Insertable<FriendTable>;
export type FriendUpdate = Updateable<FriendTable>;

// Membership
export type Membership = Selectable<MembershipTable>;
export type NewMembership = Insertable<MembershipTable>;
export type MembershipUpdate = Updateable<MembershipTable>;

// Likes
export type LikesPost = Selectable<LikesPostTable>;
export type NewLikesPost = Insertable<LikesPostTable>;

export type LikesComment = Selectable<LikesCommentTable>;
export type NewLikesComment = Insertable<LikesCommentTable>;

// Shares
export type Shares = Selectable<SharesTable>;
export type NewShares = Insertable<SharesTable>;

// Tags
export type TagsPost = Selectable<TagsPostTable>;
export type NewTagsPost = Insertable<TagsPostTable>;

export type TagsImage = Selectable<TagsImageTable>;
export type NewTagsImage = Insertable<TagsImageTable>;
