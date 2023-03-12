-- MySQL Script generated by MySQL Workbench
-- Mon Feb 20 11:14:03 2023
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`Admin`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Admin (
  `admin_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`admin_id`),
  UNIQUE INDEX `admin_id_UNIQUE` (`admin_id` ASC) VISIBLE
  )
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`GreenhillEmployee`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`GreenhillEmployee` (
  `employee_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NULL,
  `email` VARCHAR(320) NOT NULL,
  `username` VARCHAR(25) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `picture` BLOB NULL,
  `active` TINYINT(1) NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `date_created` DATE NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (`employee_id`),
  UNIQUE INDEX `employee_id_UNIQUE` (`employee_id` ASC) VISIBLE,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`FinancialAdvisors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`FinancialAdvisors` (
  `advisor_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NULL,
  `email` VARCHAR(320) NOT NULL,
  `username` VARCHAR(25) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `picture` BLOB NULL,
  `active` TINYINT(1) NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `date_created` DATE NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (`advisor_id`),
  UNIQUE INDEX `advisor_id_UNIQUE` (`advisor_id` ASC) VISIBLE,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `mydb`.`Stocks`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Stocks` (
  `stock_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cusip` VARCHAR(45) NOT NULL,
  `ticker` VARCHAR(5) NOT NULL,
  `description` TEXT NULL,
  `dividend` DECIMAL(5,2) NULL,
  `payment_freq` INT NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`stock_id`),
  UNIQUE INDEX `stock_id_UNIQUE` (`stock_id` ASC) VISIBLE,
  UNIQUE INDEX `ticker_UNIQUE` (`ticker` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`GameInfo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`GameInfo` (
  `game_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` INT UNSIGNED NULL,
  `starting_cash` DECIMAL(5,2) NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `last_update` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`game_id`),
  UNIQUE INDEX `game_id_UNIQUE` (`game_id` ASC) VISIBLE,
  UNIQUE INDEX `employee_id_UNIQUE` (`employee_id` ASC) VISIBLE,
  CONSTRAINT `employee_id_gameinfo`
    FOREIGN KEY (`employee_id`)
    REFERENCES `mydb`.`GreenhillEmployee` (`employee_id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Portfolios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Portfolios` (
  `portfolio_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `portfolio_name` VARCHAR(45) NOT NULL,
  `advisor_id` INT UNSIGNED NOT NULL,
  `game_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`portfolio_id`),
  UNIQUE INDEX `portfolio_id_UNIQUE` (`portfolio_id` ASC) VISIBLE,
  UNIQUE INDEX `advisor_id_UNIQUE` (`advisor_id` ASC) VISIBLE,
  UNIQUE INDEX `game_id_UNIQUE` (`game_id` ASC) VISIBLE,
  CONSTRAINT `advisor_id_portfolios`
    FOREIGN KEY (`advisor_id`)
    REFERENCES `mydb`.`FinancialAdvisors` (`advisor_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `game_id_portfolios`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`GameInfo` (`game_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`GameAdvisors`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`GameAdvisors` (
  `game_id` INT UNSIGNED NOT NULL,
  `advisor_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`game_id`, `advisor_id`),
  INDEX `advisor_id_idx` (`advisor_id` ASC) VISIBLE,
  CONSTRAINT `advisor_id_gameadvisors`
    FOREIGN KEY (`advisor_id`)
    REFERENCES `mydb`.`FinancialAdvisors` (`advisor_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `game_id_gameadvisors`
    FOREIGN KEY (`game_id`)
    REFERENCES `mydb`.`GameInfo` (`game_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`PortfolioStock`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`PortfolioStock` (
  `portfolio_id` INT UNSIGNED NOT NULL,
  `stock_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`portfolio_id`, `stock_id`),
  INDEX `stock_id_idx` (`stock_id` ASC) VISIBLE,
  UNIQUE INDEX `portfolio_id_UNIQUE` (`portfolio_id` ASC) VISIBLE,
  UNIQUE INDEX `stock_id_UNIQUE` (`stock_id` ASC) VISIBLE,
  CONSTRAINT `portfolio_id`
    FOREIGN KEY (`portfolio_id`)
    REFERENCES `mydb`.`Portfolios` (`portfolio_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `stock_id_portfoliostock`
    FOREIGN KEY (`stock_id`)
    REFERENCES `mydb`.`Stocks` (`stock_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`StockHistory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`StockHistory` (
  `record_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `stock_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(5,2) NULL,
  `cusip` VARCHAR(10) NOT NULL,
  `ticker` VARCHAR(5) NOT NULL,
  `description` VARCHAR(255) NULL,
  `dividend` DECIMAL(5,2) NULL,
  `payment_freq` INT NULL,
  `timestamp` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  primary key (`record_id`),
  UNIQUE INDEX `ticker_UNIQUE` (`ticker` ASC) VISIBLE,
  UNIQUE INDEX `stock_id_UNIQUE` (`stock_id` ASC) VISIBLE,
  CONSTRAINT `stock_id_stockhistory`
    FOREIGN KEY (`stock_id`)
    REFERENCES `mydb`.`Stocks` (`stock_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
