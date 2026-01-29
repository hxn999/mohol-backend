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
  id: Generated<string>;
  username: string;
  password: string;
  full_name: string;
  email: string;
  profile_pic_id: string | null;
  cover_pic_id: string | null;
  bio: string | null;
  role: UserRole;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ImageTable {
  id: Generated<string>;
  url: string;
  post_id: string | null;
  user_id: string | null;
  type: ImageType;
  created_at: Generated<Date>;
}

export interface GroupsTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  cover_img_id: string | null;
  visibility: GroupVisibility;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface NotificationTable {
  id: Generated<string>;
  user_id: string;
  message: string;
  type: NotificationType;
  ref_id: string | null;
  ref_type: NotificationRefType | null;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface PostTable {
  id: Generated<string>;
  body: string | null;
  user_id: string;
  group_id: string | null;
  original_post_id: string | null;
  type: PostType;
  visibility: PostVisibility;
  status: PostStatus;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CommentTable {
  id: Generated<string>;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  comment: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface BlockTable {
  id: Generated<string>;
  blocker_id: string;
  blocked_id: string;
  created_at: Generated<Date>;
}

export interface FollowTable {
  id: Generated<string>;
  follower_id: string;
  following_id: string;
  created_at: Generated<Date>;
}

export interface FriendTable {
  id: Generated<string>;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MembershipTable {
  id: Generated<string>;
  user_id: string;
  group_id: string;
  role: MembershipRole;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface LikesPostTable {
  id: Generated<string>;
  user_id: string;
  post_id: string;
  created_at: Generated<Date>;
}

export interface LikesCommentTable {
  id: Generated<string>;
  user_id: string;
  comment_id: string;
  created_at: Generated<Date>;
}

export interface SharesTable {
  id: Generated<string>;
  user_id: string;
  post_id: string;
  created_at: Generated<Date>;
}

export interface TagsPostTable {
  id: Generated<string>;
  post_id: string;
  user_id: string;
  created_at: Generated<Date>;
}

export interface TagsImageTable {
  id: Generated<string>;
  image_id: string;
  user_id: string;
  created_at: Generated<Date>;
}

export interface RefreshTokenTable {
  id: Generated<string>;
  user_id: string;
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
