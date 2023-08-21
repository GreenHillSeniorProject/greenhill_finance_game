-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema greenhill_localhost
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `greenhill_localhost` DEFAULT CHARACTER SET utf8mb3 ;
USE `greenhill_localhost` ;

-- -----------------------------------------------------
-- Table `greenhill_localhost`.`faq`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`faq` (
  `faq_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question` VARCHAR(255) NOT NULL,
  `answer` TEXT NOT NULL,
  `date_created` DATE NOT NULL,
  PRIMARY KEY (`faq_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`gameinfo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`gameinfo` (
  `game_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `starting_cash` DECIMAL(10,2) NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `min_stocks` INT NOT NULL DEFAULT '0',
  `max_stocks` INT NOT NULL DEFAULT '503',
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`game_id`),
  UNIQUE INDEX `game_id_UNIQUE` (`game_id` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`users` (
  `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NULL DEFAULT NULL,
  `username` VARCHAR(25) NOT NULL,
  `invitation_code` VARCHAR(10) NULL DEFAULT NULL,
  `email` VARCHAR(320) NOT NULL,
  `phone_number` VARCHAR(20) NULL DEFAULT NULL,
  `password` VARCHAR(100) NOT NULL,
  `user_type` ENUM('admin', 'employee', 'advisor') NOT NULL,
  `is_financial_advisor` TINYINT(1) NOT NULL DEFAULT '0',
  `picture` BLOB NULL DEFAULT NULL,
  `active` TINYINT(1) NULL DEFAULT NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `date_created` DATE NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`portfolios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`portfolios` (
  `portfolio_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `portfolio_name` VARCHAR(45) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `game_id` INT UNSIGNED NOT NULL,
  `asset_value` DECIMAL(10,2) NOT NULL,
  `cash_value` DECIMAL(10,2) NOT NULL,
  `portfolio_value` DECIMAL(10,2) NOT NULL,
  `last_save` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `yesterday_value` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  `last_week_value` DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`portfolio_id`),
  INDEX `user_id_portfolios` (`user_id` ASC) VISIBLE,
  INDEX `game_id_portfolios` (`game_id` ASC) VISIBLE,
  CONSTRAINT `game_id_portfolios`
    FOREIGN KEY (`game_id`)
    REFERENCES `greenhill_localhost`.`gameinfo` (`game_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `user_id_portfolios`
    FOREIGN KEY (`user_id`)
    REFERENCES `greenhill_localhost`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 19
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`stocks`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`stocks` (
  `stock_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ticker` VARCHAR(5) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `price` DECIMAL(5,2) NULL DEFAULT NULL,
  `dividend` DECIMAL(5,2) NULL DEFAULT NULL,
  `payment_freq` INT NULL DEFAULT NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`stock_id`),
  UNIQUE INDEX `stock_id_UNIQUE` (`stock_id` ASC) VISIBLE,
  UNIQUE INDEX `ticker_UNIQUE` (`ticker` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 315
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`portfoliostock`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`portfoliostock` (
  `portfolio_id` INT UNSIGNED NOT NULL,
  `stock_id` INT UNSIGNED NOT NULL,
  `shares` INT NOT NULL,
  PRIMARY KEY (`portfolio_id`, `stock_id`),
  INDEX `stock_id_idx` (`stock_id` ASC) VISIBLE,
  CONSTRAINT `portfolio_id`
    FOREIGN KEY (`portfolio_id`)
    REFERENCES `greenhill_localhost`.`portfolios` (`portfolio_id`),
  CONSTRAINT `stock_id_portfoliostock`
    FOREIGN KEY (`stock_id`)
    REFERENCES `greenhill_localhost`.`stocks` (`stock_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`referrals`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`referrals` (
  `referral_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `referrer_id` INT UNSIGNED NOT NULL,
  `referred_email` VARCHAR(320) NOT NULL,
  `referral_code` VARCHAR(10) NOT NULL,
  `status` ENUM('pending', 'accepted', 'expired') NOT NULL,
  `date_created` DATE NOT NULL DEFAULT (curdate()),
  `expiration_date` TIMESTAMP(6) NULL DEFAULT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`referral_id`),
  UNIQUE INDEX `referral_code_UNIQUE` (`referral_code` ASC) VISIBLE,
  INDEX `referrer_id_referrals` (`referrer_id` ASC) VISIBLE,
  CONSTRAINT `referrer_id_referrals`
    FOREIGN KEY (`referrer_id`)
    REFERENCES `greenhill_localhost`.`users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `greenhill_localhost`.`stockhistory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `greenhill_localhost`.`stockhistory` (
  `record_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stock_id` INT UNSIGNED NOT NULL,
  `high` DECIMAL(10,2) NULL DEFAULT NULL,
  `low` DECIMAL(10,2) NULL DEFAULT NULL,
  `open` DECIMAL(10,2) NULL DEFAULT NULL,
  `close` DECIMAL(10,2) NULL DEFAULT NULL,
  `timestamp` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`record_id`),
  UNIQUE INDEX `stock_id_timestamp_UNIQUE` (`stock_id` ASC, `timestamp` ASC) VISIBLE,
  CONSTRAINT `stock_id_stockhistory`
    FOREIGN KEY (`stock_id`)
    REFERENCES `greenhill_localhost`.`stocks` (`stock_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 87
DEFAULT CHARACTER SET = utf8mb3;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
