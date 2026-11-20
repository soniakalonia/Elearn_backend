-- ============================================================
-- ElearnHub — Database Schema
-- Run via: npm run db:setup
-- ============================================================

CREATE DATABASE IF NOT EXISTS `elearn_hub`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `elearn_hub`;



-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(120) NOT NULL,
  `email`          VARCHAR(150) NOT NULL,
  `phone`          VARCHAR(20)  DEFAULT NULL,
  `password`       VARCHAR(255) NOT NULL,
  `role`           ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `avatar`         VARCHAR(255) DEFAULT NULL,
  `is_verified`    TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `last_login_at`  DATETIME     DEFAULT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(120) NOT NULL,
  `short_heading` VARCHAR(160) NOT NULL DEFAULT '',
  `description`  TEXT         NOT NULL,
  `sort_order`   INT          NOT NULL DEFAULT 0,
  `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` () ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;-- ------------------------------------------------------------
-- courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(200) NOT NULL,
  `short_description` VARCHAR(300) NOT NULL DEFAULT '',
  `description`     TEXT,
  `objectives`      TEXT,
  `category_id`     INT UNSIGNED NOT NULL,
  `original_price`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount_price`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `status`          ENUM('draft','live','paused') NOT NULL DEFAULT 'draft',
  `image_url`       VARCHAR(500) DEFAULT NULL,
  `offer_text`      VARCHAR(255) DEFAULT NULL,
  `course_length`   VARCHAR(80)  DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courses_category` (`category_id`),
  KEY `idx_courses_status`   (`status`),
  CONSTRAINT `fk_courses_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ------------------------------------------------------------
-- cart_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `course_id`  INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_user_course` (`user_id`, `course_id`),
  CONSTRAINT `fk_cart_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_cart_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- wishlist_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `course_id`  INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_user_course` (`user_id`, `course_id`),
  CONSTRAINT `fk_wish_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_wish_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;