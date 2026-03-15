-- Rename bunny_video_id → video_url in lessons table
-- Admins will paste the full Bunny.net embed URL instead of just the video ID
-- Note: recordings and tutorials tables do not exist yet.
-- They will be created with video_url from the start (no rename needed).
ALTER TABLE lessons RENAME COLUMN bunny_video_id TO video_url;
