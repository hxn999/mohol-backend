

CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'share');
CREATE TYPE post_visibility AS ENUM ('public', 'private', 'friends_only', 'group_only');
CREATE TYPE post_status AS ENUM ('active', 'archived', 'deleted', 'pending');
CREATE TYPE group_visibility AS ENUM ('public', 'private', 'hidden');
CREATE TYPE membership_role AS ENUM ('member', 'admin', 'moderator', 'owner');
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'friend_request', 'mention', 'group_invite', 'post_share');
CREATE TYPE notification_ref_type AS ENUM ('post', 'comment', 'user', 'group');
CREATE TYPE image_type AS ENUM ('profile', 'cover', 'post', 'comment', 'group_cover');

<<<<<<< HEAD
=======
    
>>>>>>> 6631de55ce30c608348aa3bf0b09e92c6bbeace5

-- User Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    profile_pic_id INT,
    cover_pic_id INT,
    bio TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_user_email ON users(email);


-- MEDIA TABLES


-- Image Table
CREATE TABLE image (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    post_id INT,
    user_id INT,
    type image_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_image_post_id ON image(post_id);
CREATE INDEX idx_image_user_id ON image(user_id);


-- SOCIAL TABLES


-- Group Table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cover_img_id INT,
    visibility group_visibility DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_group_title ON groups(title);

-- Notification Table
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    ref_id INT,
    ref_type notification_ref_type,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_is_read ON notification(is_read);


-- CONTENT TABLES


-- Post Table
CREATE TABLE post (
    id SERIAL PRIMARY KEY,
    body TEXT,
    user_id INT NOT NULL,
    group_id INT,
    original_post_id INT,
    type post_type DEFAULT 'text',
    visibility post_visibility DEFAULT 'public',
    status post_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_user_id ON post(user_id);
CREATE INDEX idx_post_group_id ON post(group_id);
CREATE INDEX idx_post_created_at ON post(created_at DESC);
CREATE INDEX idx_post_status ON post(status);

-- Comment Table
CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comment_post_id ON comment(post_id);
CREATE INDEX idx_comment_user_id ON comment(user_id);
CREATE INDEX idx_comment_parent_id ON comment(parent_id);


-- USER RELATIONSHIP TABLES (Many-to-Many)


-- Block Table
CREATE TABLE block (
    id SERIAL PRIMARY KEY,
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_block_blocker_id ON block(blocker_id);
CREATE INDEX idx_block_blocked_id ON block(blocked_id);

-- Follow Table
CREATE TABLE follow (
    id SERIAL PRIMARY KEY,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follow_follower_id ON follow(follower_id);
CREATE INDEX idx_follow_following_id ON follow(following_id);

-- Friend Table
CREATE TABLE friend (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friend_user_id ON friend(user_id);
CREATE INDEX idx_friend_friend_id ON friend(friend_id);


-- GROUP MEMBERSHIP TABLE


-- Membership Table
CREATE TABLE membership (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    role membership_role DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

CREATE INDEX idx_membership_user_id ON membership(user_id);
CREATE INDEX idx_membership_group_id ON membership(group_id);


-- LIKE TABLES


-- Post Likes Table
CREATE TABLE likes_post (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_post_user_id ON likes_post(user_id);
CREATE INDEX idx_likes_post_post_id ON likes_post(post_id);

-- Comment Likes Table
CREATE TABLE likes_comment (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    comment_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_likes_comment_user_id ON likes_comment(user_id);
CREATE INDEX idx_likes_comment_comment_id ON likes_comment(comment_id);


-- SHARE TABLE


-- Shares Table
CREATE TABLE shares (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_post_id ON shares(post_id);


-- AUTH TABLES


-- Refresh Token Table
CREATE TABLE refresh_token (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- TAG TABLES


-- Post Tags User Table
CREATE TABLE tags_post (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Image Tags User Table
CREATE TABLE tags_image (
    id SERIAL PRIMARY KEY,
    image_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(image_id, user_id)
);


-- FOREIGN KEY CONSTRAINTS
ALTER TABLE refresh_token
    ADD CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE users
    ADD CONSTRAINT fk_user_profile_pic FOREIGN KEY (profile_pic_id) REFERENCES image(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_user_cover_pic FOREIGN KEY (cover_pic_id) REFERENCES image(id) ON DELETE SET NULL;

ALTER TABLE image
    ADD CONSTRAINT fk_image_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_image_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE groups
    ADD CONSTRAINT fk_group_cover_img FOREIGN KEY (cover_img_id) REFERENCES image(id) ON DELETE SET NULL;

ALTER TABLE notification
    ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE post
    ADD CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_post_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_post_original_post FOREIGN KEY (original_post_id) REFERENCES post(id) ON DELETE SET NULL;

ALTER TABLE comment
    ADD CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment(id) ON DELETE CASCADE;

ALTER TABLE block
    ADD CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT chk_block_not_self CHECK (blocker_id != blocked_id);

ALTER TABLE follow
    ADD CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_follow_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT chk_follow_not_self CHECK (follower_id != following_id);

ALTER TABLE friend
    ADD CONSTRAINT fk_friend_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_friend_friend FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT chk_friend_not_self CHECK (user_id != friend_id);

ALTER TABLE membership
    ADD CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_membership_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE likes_post
    ADD CONSTRAINT fk_likes_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_likes_post_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE;

ALTER TABLE likes_comment
    ADD CONSTRAINT fk_likes_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_likes_comment_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE;

ALTER TABLE shares
    ADD CONSTRAINT fk_shares_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_shares_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE;

ALTER TABLE tags_post
    ADD CONSTRAINT fk_tags_post_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_tags_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tags_image
    ADD CONSTRAINT fk_tags_image_image FOREIGN KEY (image_id) REFERENCES image(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_tags_image_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;