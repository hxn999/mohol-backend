-- ============================================================
-- DEMO DATA FOR SOCIAL NETWORK
-- Designed to demonstrate recommendation algorithms:
-- - "People You May Know" (mutual friends, shared groups)
-- - "Posts You May Like" (based on engagement patterns)
-- - "Groups You May Like" (based on interests/friends)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- USERS (15 users across different interest clusters)
-- ------------------------------------------------------------
-- Cluster A: Tech people (users 1-5)
-- Cluster B: Sports people (users 6-10)
-- Cluster C: Mixed/bridge users (users 11-15)

INSERT INTO users (username, password, full_name, email, bio, role) VALUES
('alice_dev',    '$2b$10$hash1', 'Alice Rahman',   'alice@example.com',   'Full-stack developer. Love open source.', 'user'),
('bob_codes',    '$2b$10$hash2', 'Bob Hossain',    'bob@example.com',     'Backend engineer. Python & Go enthusiast.', 'user'),
('carol_ux',     '$2b$10$hash3', 'Carol Ahmed',    'carol@example.com',   'UI/UX designer. Coffee addict.', 'user'),
('dave_ml',      '$2b$10$hash4', 'Dave Islam',     'dave@example.com',    'Machine learning researcher.', 'user'),
('eve_devops',   '$2b$10$hash5', 'Eve Khanam',     'eve@example.com',     'DevOps engineer. Cloud native.', 'user'),
('frank_fc',     '$2b$10$hash6', 'Frank Uddin',    'frank@example.com',   'Football fanatic. Playing since age 5.', 'user'),
('grace_runs',   '$2b$10$hash7', 'Grace Begum',    'grace@example.com',   'Marathon runner. Fitness coach.', 'user'),
('henry_hoops',  '$2b$10$hash8', 'Henry Miah',     'henry@example.com',   'Basketball player. NBA stats nerd.', 'user'),
('irene_swims',  '$2b$10$hash9', 'Irene Chowdhury','irene@example.com',   'Swimmer. Loves the ocean.', 'user'),
('jack_cricket', '$2b$10$hashA', 'Jack Sarker',    'jack@example.com',    'Cricket is life. Dhaka Dynamites fan.', 'user'),
('kate_bridge',  '$2b$10$hashB', 'Kate Akter',     'kate@example.com',    'Tech + sports = me. Coder by day, runner by night.', 'user'),
('liam_social',  '$2b$10$hashC', 'Liam Reza',      'liam@example.com',    'Community builder. Connects everyone.', 'user'),
('mia_writer',   '$2b$10$hashD', 'Mia Sultana',    'mia@example.com',     'Tech writer. Blogs about dev tools.', 'user'),
('noah_photo',   '$2b$10$hashE', 'Noah Karim',     'noah@example.com',    'Photographer. Nature and sports.', 'user'),
('admin_user',   '$2b$10$hashF', 'Site Admin',     'admin@example.com',   'Platform administrator.', 'admin');


-- ------------------------------------------------------------
-- GROUPS
-- ------------------------------------------------------------

INSERT INTO groups (title, description, visibility) VALUES
('Dhaka Developers',        'A community for software developers in Dhaka.',         'public'),   -- 1
('Open Source Bangladesh',  'Contributing to open source from Bangladesh.',           'public'),   -- 2
('ML & AI Enthusiasts',     'Machine learning, deep learning, and AI research.',      'public'),   -- 3
('DevOps & Cloud',          'Kubernetes, Docker, CI/CD, cloud infrastructure.',       'public'),   -- 4
('Dhaka Football Club',     'Casual football meetups every Friday.',                  'public'),   -- 5
('Marathon Runners BD',     'Training plans, race events, running tips.',             'public'),   -- 6
('BD Basketball League',    'Pick-up games and league discussions.',                  'public'),   -- 7
('Cricket Lovers BD',       'All things cricket. BPL, national team, local leagues.', 'public'),  -- 8
('Tech & Sports Crossover', 'For people who love both tech and sports.',              'public'),   -- 9
('Dhaka Photography Club',  'Share your shots. Critique and improve together.',       'public');   -- 10


-- ------------------------------------------------------------
-- MEMBERSHIPS
-- ------------------------------------------------------------
-- Tech cluster joins tech groups
-- Sports cluster joins sports groups
-- Bridge users join both (key for cross-cluster recommendations)

INSERT INTO membership (user_id, group_id, role) VALUES
-- Alice (tech): Dhaka Devs, Open Source, ML
(1, 1, 'owner'), (1, 2, 'admin'), (1, 3, 'member'),
-- Bob (tech): Dhaka Devs, Open Source, DevOps
(2, 1, 'admin'), (2, 2, 'member'), (2, 4, 'member'),
-- Carol (tech): Dhaka Devs, Open Source
(3, 1, 'member'), (3, 2, 'member'),
-- Dave (tech): ML, Dhaka Devs
(4, 3, 'owner'), (4, 1, 'member'),
-- Eve (tech): DevOps, Dhaka Devs
(5, 4, 'owner'), (5, 1, 'member'),
-- Frank (sports): Football, Cricket
(6, 5, 'owner'), (6, 8, 'member'),
-- Grace (sports): Marathon, Tech&Sports
(7, 6, 'owner'), (7, 9, 'member'),
-- Henry (sports): Basketball, Cricket
(8, 7, 'owner'), (8, 8, 'member'),
-- Irene (sports): Marathon, Swimming->Photography
(9, 6, 'member'), (9, 10, 'member'),
-- Jack (sports): Cricket, Football
(10, 8, 'owner'), (10, 5, 'member'),
-- Kate (bridge): Tech&Sports, Dhaka Devs, Marathon, Football
(11, 9, 'owner'), (11, 1, 'member'), (11, 6, 'member'), (11, 5, 'member'),
-- Liam (bridge): Dhaka Devs, Football, Basketball, Open Source
(12, 1, 'member'), (12, 5, 'member'), (12, 7, 'member'), (12, 2, 'member'),
-- Mia (bridge): Dhaka Devs, Open Source, Tech&Sports
(13, 1, 'member'), (13, 2, 'member'), (13, 9, 'member'),
-- Noah (bridge): Photography, Sports groups
(14, 10, 'owner'), (14, 6, 'member'), (14, 5, 'member'), (14, 9, 'member');


-- ------------------------------------------------------------
-- FOLLOWS
-- ------------------------------------------------------------
-- Dense within clusters, sparse across (bridge users connect them)

INSERT INTO follow (follower_id, following_id) VALUES
-- Tech cluster follows each other
(1,2),(1,3),(1,4),(1,5),
(2,1),(2,3),(2,4),
(3,1),(3,2),(3,4),
(4,1),(4,2),(4,5),
(5,1),(5,2),(5,4),
-- Sports cluster follows each other
(6,7),(6,8),(6,10),
(7,6),(7,9),(7,10),
(8,6),(8,7),(8,10),
(9,7),(9,8),(9,10),
(10,6),(10,7),(10,8),
-- Bridge users follow across clusters
(11,1),(11,2),(11,7),(11,6),   -- Kate follows tech + sports
(12,1),(12,6),(12,7),(12,8),   -- Liam follows tech + sports
(13,1),(13,2),(13,3),(13,7),   -- Mia mostly tech + one sports
(14,7),(14,9),(14,6),(14,1),   -- Noah sports + alice
-- Some cross-cluster follows (sparse, for recommendation signal)
(1,11),(2,12),(4,13),(6,12),(8,11),(10,14);


-- ------------------------------------------------------------
-- FRIENDS
-- ------------------------------------------------------------

INSERT INTO friend (user_id, friend_id, status) VALUES
-- Tech cluster friendships
(1,2,'accepted'),(1,3,'accepted'),(1,4,'accepted'),
(2,5,'accepted'),(3,4,'accepted'),(4,5,'accepted'),
-- Sports cluster friendships
(6,7,'accepted'),(6,10,'accepted'),
(7,9,'accepted'),(8,10,'accepted'),(9,10,'accepted'),
-- Bridge user friendships (cross-cluster connections)
(11,1,'accepted'),(11,7,'accepted'),(11,6,'accepted'),
(12,2,'accepted'),(12,6,'accepted'),(12,8,'accepted'),
(13,1,'accepted'),(13,3,'accepted'),
(14,9,'accepted'),(14,7,'accepted'),
-- Pending requests (algorithm can suggest accepting)
(1,11,'pending'),   -- alice hasn't accepted kate yet
(6,13,'pending'),   -- frank sent request to mia
(3,12,'pending');   -- carol sent request to liam


-- ------------------------------------------------------------
-- POSTS
-- ------------------------------------------------------------

INSERT INTO post (body, user_id, group_id, type, visibility, status) VALUES
-- Alice posts (tech)
('Just deployed my first NestJS microservice to AWS. Feeling great! #nodejs #aws', 1, 1, 'text', 'public', 'active'),
('Open source tip: always write a good README before anything else.', 1, 2, 'text', 'public', 'active'),
('Anyone else think Prisma ORM is a game changer for TypeScript projects?', 1, NULL, 'text', 'public', 'active'),

-- Bob posts (tech)
('Go routines still blow my mind after 2 years of using them.', 2, 1, 'text', 'public', 'active'),
('Hot take: REST APIs are still better than GraphQL for most use cases.', 2, NULL, 'text', 'public', 'active'),

-- Carol posts (tech/design)
('Just redesigned our onboarding flow. 40% drop in user confusion. Design matters!', 3, 1, 'text', 'public', 'active'),
('Figma auto-layout is underrated. Thread on how I use it 👇', 3, NULL, 'text', 'public', 'active'),

-- Dave posts (ML)
('New paper on transformer attention mechanisms dropped. Reading it now.', 4, 3, 'text', 'public', 'active'),
('Training a model on local Bengali text data. Interesting challenges with tokenization.', 4, 3, 'text', 'public', 'active'),

-- Eve posts (DevOps)
('K8s tip: always set resource limits on your containers. Learned the hard way.', 5, 4, 'text', 'public', 'active'),
('Blue-green deployment saved us last night. Zero downtime deploy FTW.', 5, 1, 'text', 'public', 'active'),

-- Frank posts (football)
('Friday football at Dhanmondi field. Anyone joining? We need 2 more players!', 6, 5, 'text', 'public', 'active'),
('Watched the Champions League final live. What a match!', 6, NULL, 'text', 'public', 'active'),

-- Grace posts (running)
('Completed my 5th marathon today! New personal best: 3h 42m 🏃‍♀️', 7, 6, 'text', 'public', 'active'),
('Training plan for your first half marathon. Week 1 starts here:', 7, 6, 'text', 'public', 'active'),

-- Henry posts (basketball)
('Pick-up game at Gulshan court tomorrow 6pm. All skill levels welcome!', 8, 7, 'text', 'public', 'active'),

-- Irene posts (swimming/fitness)
('Early morning swim session done. 2km before breakfast feels incredible.', 9, 6, 'text', 'public', 'active'),

-- Jack posts (cricket)
('Bangladesh vs India test match predictions? I say BD wins by innings!', 10, 8, 'text', 'public', 'active'),
('Local league cricket this weekend at BKSP. Come watch!', 10, 5, 'text', 'public', 'active'),

-- Kate bridge posts (tech + sports)
('Built a fitness tracking app using Next.js and Prisma. Dogfooding my own runs!', 11, 9, 'text', 'public', 'active'),
('Running AND coding in the same day is my superpower. What''s yours?', 11, NULL, 'text', 'public', 'active'),

-- Liam posts (community)
('Organizing a tech + sports mixer event in Dhaka next month. Who''s in?', 12, 9, 'text', 'public', 'active'),
('Mutual friends are the best way to find your people. Agree?', 12, NULL, 'text', 'public', 'active'),

-- Mia posts (writing/tech)
('Published my article: "Why developer documentation is broken and how to fix it"', 13, 2, 'text', 'public', 'active'),
('Hot take: the best developers I know are also great writers.', 13, NULL, 'text', 'public', 'active'),

-- Noah posts (photography)
('Shot the marathon runners at Hatirjheel today. The light was perfect.', 14, 10, 'text', 'public', 'active'),
('Sports photography tip: use burst mode and shoot at 1/1000s minimum.', 14, 9, 'text', 'public', 'active');


-- ------------------------------------------------------------
-- LIKES ON POSTS
-- ------------------------------------------------------------
-- Engagement patterns reveal interests for recommendations

INSERT INTO likes_post (user_id, post_id) VALUES
-- Tech users like tech posts
(2,1),(3,1),(4,1),(5,1),(13,1),   -- Alice's NestJS post
(1,4),(3,4),(5,4),                 -- Bob's Go post
(1,6),(2,6),(4,6),                 -- Carol's design post
(1,8),(2,8),(5,8),                 -- Dave's ML post
(1,10),(2,10),(3,10),              -- Eve's K8s post
(1,11),(2,11),(3,11),              -- Eve's blue-green post

-- Sports users like sports posts
(7,12),(8,12),(10,12),(14,12),     -- Frank's football post
(6,14),(9,14),(10,14),(14,14),     -- Grace's marathon post
(6,16),(7,16),(10,16),             -- Henry's basketball post
(6,18),(7,18),(8,18),              -- Jack's cricket post

-- Bridge users like BOTH tech and sports posts (key signal)
(11,1),(11,4),(11,14),(11,12),     -- Kate likes tech + sports
(12,1),(12,6),(12,12),(12,16),     -- Liam likes tech + sports
(13,1),(13,4),(13,25),(13,26),     -- Mia likes tech + writing
(14,14),(14,12),(14,27),(14,28),   -- Noah likes sports + photography

-- Cross-cluster engagement (weak signal, but present)
(1,22),(1,23),    -- Alice likes Kate's and Liam's posts
(6,20),(6,21),    -- Frank likes Kate's fitness app post
(4,25),(5,26);    -- Dave/Eve like Mia's writing posts


-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------

INSERT INTO comment (post_id, user_id, parent_id, comment) VALUES
-- On Alice's NestJS post
(1, 2, NULL, 'Nice! Which AWS service did you use? ECS or EC2?'),
(1, 5, NULL, 'Did you containerize it with Docker? Would love to see the compose file.'),
(1, 2, 2,    'ECS with Fargate is my go-to for NestJS these days.'),
(1, 11, NULL, 'Amazing! I built something similar for my fitness tracker.'),

-- On Bob's hot take about REST vs GraphQL
(5, 1, NULL, 'Controversial but I partially agree. Depends on the use case.'),
(5, 3, NULL, 'GraphQL is great for complex frontends though!'),
(5, 4, NULL, 'For ML APIs REST is definitely simpler to work with.'),

-- On Grace's marathon post
(14, 7, NULL, 'Congratulations Grace!! What was your training plan?'),
(14, 9, NULL, 'Incredible time! You inspire me to run more.'),
(14, 11, NULL, 'I tracked this race with my app! You were flying 🔥'),
(14, 6, NULL, 'Respect! I could never run that far lol.'),

-- On Kate's fitness app post
(20, 1, NULL, 'What stack did you use for the mobile app part?'),
(20, 7, NULL, 'Can I beta test this? I need something like this for marathon training!'),
(20, 11, 12, 'Using Next.js as a PWA for now, might go React Native later.'),

-- On Liam's mixer event post
(22, 1, NULL, 'Count me in! Tech + sports sounds perfect.'),
(22, 6, NULL, 'I''m bringing the football crew!'),
(22, 7, NULL, 'This is exactly what the Tech&Sports group was made for!'),
(22, 11, NULL, 'I''ll help organize. DM me Liam.');


-- ------------------------------------------------------------
-- SHARES
-- ------------------------------------------------------------

INSERT INTO shares (user_id, post_id) VALUES
(2, 1),   -- Bob shares Alice's NestJS post
(3, 1),   -- Carol shares Alice's NestJS post
(11, 14), -- Kate shares Grace's marathon post
(12, 22), -- Liam shares his own event post (reshare)
(14, 15), -- Noah shares Grace's training plan
(7, 20),  -- Grace shares Kate's fitness app
(6, 22),  -- Frank shares Liam's mixer event
(1, 25);  -- Alice shares Mia's documentation article


-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------

INSERT INTO notification (user_id, message, type, ref_id, ref_type, is_read) VALUES
(1, 'Bob Hossain liked your post',           'like',           1,  'post',    true),
(1, 'Carol Ahmed liked your post',           'like',           1,  'post',    true),
(1, 'Bob Hossain commented on your post',    'comment',        1,  'post',    false),
(1, 'Kate Akter started following you',      'follow',         11, 'user',    false),
(2, 'Alice Rahman liked your post',          'like',           4,  'post',    true),
(7, 'Kate Akter commented on your post',     'comment',        14, 'post',    false),
(7, 'Irene Chowdhury liked your post',       'like',           14, 'post',    true),
(11,'Alice Rahman commented on your post',   'comment',        20, 'post',    false),
(11,'Grace Begum commented on your post',    'comment',        20, 'post',    false),
(12,'Alice Rahman commented on your post',   'comment',        22, 'post',    false),
(12,'Frank Uddin commented on your post',    'comment',        22, 'post',    false),
(6, 'Liam Reza sent you a friend request',   'friend_request', 12, 'user',    false),
(3, 'Liam Reza sent you a friend request',   'friend_request', 12, 'user',    false);


-- ------------------------------------------------------------
-- REFRESH TOKENS (sample active sessions)
-- ------------------------------------------------------------

INSERT INTO refresh_token (user_id, token_hash, expires_at, revoked) VALUES
(1,  '$2b$10$tokenAlice',  NOW() + INTERVAL '7 days', false),
(2,  '$2b$10$tokenBob',    NOW() + INTERVAL '7 days', false),
(11, '$2b$10$tokenKate',   NOW() + INTERVAL '7 days', false),
(12, '$2b$10$tokenLiam',   NOW() + INTERVAL '7 days', false);

COMMIT;