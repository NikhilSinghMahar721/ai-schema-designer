CREATE TABLE `authors` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `books` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `author_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON DELETE CASCADE
);

CREATE TABLE `members` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `email` VARCHAR(254) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
);

CREATE TABLE `borrows` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `book_id` INT NOT NULL,
  `member_id` INT NOT NULL,
  `borrow_date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT
);
