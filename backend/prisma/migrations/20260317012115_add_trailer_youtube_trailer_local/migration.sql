-- AlterTable
ALTER TABLE `movies` ADD COLUMN `country_code` VARCHAR(10) NULL,
    ADD COLUMN `trailer_youtube_url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `persons` ADD COLUMN `person_type` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `series` ADD COLUMN `trailer_url` VARCHAR(191) NULL,
    ADD COLUMN `trailer_youtube_url` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `series_genres` (
    `series_id` INTEGER NOT NULL,
    `genre_id` INTEGER NOT NULL,

    PRIMARY KEY (`series_id`, `genre_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `series_genres` ADD CONSTRAINT `series_genres_series_id_fkey` FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `series_genres` ADD CONSTRAINT `series_genres_genre_id_fkey` FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
