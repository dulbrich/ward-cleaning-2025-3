-- Update avatar URLs to match available files
-- Replace non-existent avatar files with monster avatars

-- Update avatar6 to monster_1
UPDATE default_avatars
SET avatar_url = '/images/avatars/monster_1.png',
    avatar_name = 'Monster Cleaner'
WHERE avatar_url = '/images/avatars/avatar6.png';

-- Update avatar7 to monster_2
UPDATE default_avatars
SET avatar_url = '/images/avatars/monster_2.png',
    avatar_name = 'Dust Monster'
WHERE avatar_url = '/images/avatars/avatar7.png';

-- Update avatar8 to monster_3
UPDATE default_avatars
SET avatar_url = '/images/avatars/monster_3.png',
    avatar_name = 'Cleaning Beast'
WHERE avatar_url = '/images/avatars/avatar8.png'; 