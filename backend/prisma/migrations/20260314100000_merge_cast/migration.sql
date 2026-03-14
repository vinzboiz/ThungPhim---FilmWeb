-- CreateTable
CREATE TABLE `cast` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `movie_id` INTEGER NULL,
    `episode_id` INTEGER NULL,
    `person_id` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL,

    INDEX `idx_cast_movie`(`movie_id`),
    INDEX `idx_cast_episode`(`episode_id`),
    UNIQUE INDEX `cast_movie_id_episode_id_person_id_role_key`(`movie_id`, `episode_id`, `person_id`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cast` ADD CONSTRAINT `cast_movie_id_fkey` FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cast` ADD CONSTRAINT `cast_episode_id_fkey` FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cast` ADD CONSTRAINT `cast_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data from movie_cast
INSERT INTO `cast` (`movie_id`, `episode_id`, `person_id`, `role`)
SELECT `movie_id`, NULL, `person_id`, `role` FROM `movie_cast`;

-- Migrate data from episode_cast
INSERT INTO `cast` (`movie_id`, `episode_id`, `person_id`, `role`)
SELECT NULL, `episode_id`, `person_id`, `role` FROM `episode_cast`;

-- DropForeignKey
ALTER TABLE `movie_cast` DROP FOREIGN KEY `movie_cast_movie_id_fkey`;

-- DropForeignKey
ALTER TABLE `movie_cast` DROP FOREIGN KEY `movie_cast_person_id_fkey`;

-- DropForeignKey
ALTER TABLE `episode_cast` DROP FOREIGN KEY `episode_cast_episode_id_fkey`;

-- DropForeignKey
ALTER TABLE `episode_cast` DROP FOREIGN KEY `episode_cast_person_id_fkey`;

-- DropTable
DROP TABLE `movie_cast`;

DROP TABLE `episode_cast`;
