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


-- ------------------------------------------------------------
-- career_tracks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `career_tracks` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(200) NOT NULL,
  `description`     TEXT,
  `image_url`       VARCHAR(500) DEFAULT NULL,
  `duration`        VARCHAR(80)  DEFAULT NULL,
  `level`           VARCHAR(80)  DEFAULT NULL,
  `skills`          TEXT, /* Comma separated e.g. "Linux,Docker" */
  `outcomes`        TEXT, /* Newline separated objectives */
  `steps`           TEXT, /* Newline separated steps */
  `category_id`     INT UNSIGNED NOT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tracks_category` FOREIGN KEY (`category_id`)
    REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- paths (career tracks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `paths` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(160) NOT NULL,
  `description` TEXT         NOT NULL,
  `image_url`   VARCHAR(255) DEFAULT NULL,
  `duration`    VARCHAR(60)  DEFAULT NULL,
  `level`       VARCHAR(60)  DEFAULT NULL,
  `skills`      JSON         DEFAULT NULL,
  `outcomes`    TEXT         DEFAULT NULL,
  `steps`       TEXT         DEFAULT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_paths_category` (`category_id`),
  CONSTRAINT `fk_paths_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- enrollments (user ↔ course, tracks progress)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          INT UNSIGNED NOT NULL,
  `course_id`        INT UNSIGNED NOT NULL,
  `progress`         TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0–100 %
  `last_lesson`      VARCHAR(255) DEFAULT NULL,             -- last lesson title they touched
  `last_accessed_at` DATETIME     DEFAULT NULL,
  `completed_at`     DATETIME     DEFAULT NULL,             -- set when progress reaches 100
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_enrollment_user_course` (`user_id`, `course_id`),
  KEY `idx_enrollments_user`    (`user_id`),
  KEY `idx_enrollments_course`  (`course_id`),
  KEY `idx_enrollments_completed` (`completed_at`),
  CONSTRAINT `fk_enroll_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_enroll_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- orders (one row per checkout)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        INT UNSIGNED NOT NULL,
  `order_code`     VARCHAR(40) NOT NULL,                -- e.g. EH-260221-3041
  `subtotal`       DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount`       DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total`          DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currency`       VARCHAR(8)  NOT NULL DEFAULT 'INR',
  `status`         ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(40) DEFAULT NULL,            -- razorpay / cashfree / upi
  `payment_ref`    VARCHAR(120) DEFAULT NULL,           -- provider txn id
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_code` (`order_code`),
  KEY `idx_orders_user`   (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- order_items (line items per order)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   INT UNSIGNED NOT NULL,
  `course_id`  INT UNSIGNED NOT NULL,
  `title`      VARCHAR(200) NOT NULL,      -- snapshot at purchase time
  `price`      DECIMAL(10,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order`  (`order_id`),
  KEY `idx_order_items_course` (`course_id`),
  CONSTRAINT `fk_items_order`  FOREIGN KEY (`order_id`)  REFERENCES `orders`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_items_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;