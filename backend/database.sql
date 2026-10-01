-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 01, 2026 at 10:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hope_haven_library`
--
CREATE DATABASE IF NOT EXISTS `hope_haven_library` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `hope_haven_library`;

-- --------------------------------------------------------

--
-- Table structure for table `account_requests`
--

CREATE TABLE `account_requests` (
  `id` int(11) NOT NULL,
  `first_name` varchar(120) NOT NULL,
  `last_name` varchar(120) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` enum('STUDENT','TEACHER','GUEST') NOT NULL DEFAULT 'STUDENT',
  `message` text DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-09 08:25:29'),
(4, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-09 08:35:33'),
(5, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-09 13:08:44'),
(8, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-09 15:29:48'),
(12, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-09 15:56:40'),
(15, 1, 'QR_REGENERATED', 'CARD', 4, 'LIB0001', NULL, '2026-09-09 16:02:58'),
(16, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-09 16:13:13'),
(17, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-09 16:14:16'),
(18, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-09 16:16:41'),
(19, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-09 16:43:56'),
(20, 1, 'USER_CREATED', 'USER', 4, 'Librarian created STUDENT STU0001', NULL, '2026-09-09 16:47:48'),
(21, 1, 'USER_CREATED', 'USER', 5, 'Librarian created TEACHER TCH0001', NULL, '2026-09-09 16:47:48'),
(23, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 05:23:09'),
(24, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 05:23:26'),
(25, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 05:27:01'),
(26, 1, 'USER_CREATED', 'USER', 6, 'Librarian created STUDENT STU0002', NULL, '2026-09-10 05:38:25'),
(27, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 06:58:18'),
(28, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 07:39:51'),
(29, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 07:47:41'),
(30, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 07:55:54'),
(31, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 09:23:40'),
(32, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 09:37:23'),
(33, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 09:56:15'),
(34, 1, 'QR_DELETED', 'CARD', 7, 'Deleted card 7 for user 6', NULL, '2026-09-10 10:00:30'),
(35, 1, 'QR_REGENERATED', 'CARD', 8, 'STU0002', NULL, '2026-09-10 10:00:46'),
(36, 1, 'QR_DELETED', 'CARD', 5, 'Deleted card 5 for user 4', NULL, '2026-09-10 10:00:53'),
(37, 1, 'QR_REGENERATED', 'CARD', 9, 'STU0001', NULL, '2026-09-10 10:00:59'),
(38, 1, 'QR_DELETED', 'CARD', 6, 'Deleted card 6 for user 5', NULL, '2026-09-10 10:01:08'),
(39, 1, 'QR_REGENERATED', 'CARD', 10, 'TCH0001', NULL, '2026-09-10 10:01:15'),
(43, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 10:12:18'),
(44, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 11:17:32'),
(45, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 11:17:38'),
(46, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 11:17:43'),
(47, 1, 'BOOK_ADDED', 'BOOK', 4, 'The Great Gatsby (9780743273565), 3 copies', NULL, '2026-09-10 12:02:42'),
(48, 1, 'BOOK_ADDED', 'BOOK', 5, 'To Kill a Mockingbird (9780060935467), 3 copies', NULL, '2026-09-10 12:02:51'),
(49, 1, 'BOOK_ADDED', 'BOOK', 6, '1984 (9780451524935), 3 copies', NULL, '2026-09-10 12:02:59'),
(50, 1, 'BOOK_ADDED', 'BOOK', 7, 'The Hobbit (9780547928227), 2 copies', NULL, '2026-09-10 12:03:08'),
(51, 1, 'BOOK_ADDED', 'BOOK', 8, 'Pride and Prejudice (9780141439518), 2 copies', NULL, '2026-09-10 12:03:16'),
(58, 1, 'BOOK_ADDED', 'BOOK', 15, 'Educated (9780399590504), 2 copies', NULL, '2026-09-10 12:04:19'),
(61, 1, 'BOOK_ADDED', 'BOOK', 18, 'Sapiens: A Brief History of Humankind (9780062316097), 2 copies', NULL, '2026-09-10 12:04:46'),
(62, 1, 'USER_CREATED', 'USER', 7, 'Seeded STUDENT STU0003', NULL, '2026-09-10 12:04:46'),
(63, 1, 'USER_CREATED', 'USER', 8, 'Seeded STUDENT STU0004', NULL, '2026-09-10 12:04:46'),
(64, 1, 'USER_CREATED', 'USER', 9, 'Seeded STUDENT STU0005', NULL, '2026-09-10 12:04:46'),
(65, 1, 'USER_CREATED', 'USER', 10, 'Seeded STUDENT STU0006', NULL, '2026-09-10 12:04:46'),
(66, 1, 'USER_CREATED', 'USER', 11, 'Seeded STUDENT STU0007', NULL, '2026-09-10 12:04:46'),
(67, 1, 'USER_CREATED', 'USER', 12, 'Seeded STUDENT STU0008', NULL, '2026-09-10 12:04:46'),
(68, 1, 'USER_CREATED', 'USER', 13, 'Seeded TEACHER TCH0002', NULL, '2026-09-10 12:04:46'),
(69, 1, 'USER_CREATED', 'USER', 14, 'Seeded TEACHER TCH0003', NULL, '2026-09-10 12:04:46'),
(70, 1, 'USER_CREATED', 'USER', 15, 'Seeded TEACHER TCH0004', NULL, '2026-09-10 12:04:46'),
(71, 1, 'USER_CREATED', 'USER', 16, 'Seeded GUEST GST0001', NULL, '2026-09-10 12:04:47'),
(72, 1, 'USER_CREATED', 'USER', 17, 'Seeded GUEST GST0002', NULL, '2026-09-10 12:04:47'),
(73, 1, 'EBOOK_UPLOADED', 'EBOOK', 1, 'Mathematics for Grade 7', NULL, '2026-09-10 12:04:55'),
(74, 1, 'EBOOK_UPLOADED', 'EBOOK', 2, 'English Grammar Essentials', NULL, '2026-09-10 12:05:04'),
(75, 1, 'EBOOK_UPLOADED', 'EBOOK', 3, 'Biology for Lower Secondary', NULL, '2026-09-10 12:05:13'),
(77, 1, 'EBOOK_UPLOADED', 'EBOOK', 5, 'Computer Basics for Students', NULL, '2026-09-10 12:05:30'),
(78, 1, 'EBOOK_UPLOADED', 'EBOOK', 6, 'Physics in Everyday Life', NULL, '2026-09-10 12:05:39'),
(79, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 12:13:10'),
(80, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 12:14:09'),
(93, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 12:29:04'),
(95, 1, 'BOOK_RETURNED', 'RETURN', 12, '{\"copy\":\"BOOK018-C1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 12:29:04'),
(97, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 12:57:00'),
(98, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:29:13'),
(100, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:29:59'),
(101, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:30:15'),
(103, 1, 'BOOK_BORROWED', 'BORROWING', 23, '{\"user\":\"STU0001\",\"copy\":\"BOOK001-C1\"}', NULL, '2026-09-10 13:30:15'),
(104, 1, 'BOOK_RETURNED', 'RETURN', 13, '{\"copy\":\"BOOK001-C1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 13:30:15'),
(106, 1, 'BOOK_RETURNED', 'RETURN', 14, '{\"copy\":\"BOOK002-C1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 13:30:15'),
(107, 1, 'EBOOK_DELETED', 'EBOOK', 6, 'Physics in Everyday Life', NULL, '2026-09-10 13:38:25'),
(109, 1, 'EBOOK_DELETED', 'EBOOK', 5, 'Computer Basics for Students', NULL, '2026-09-10 13:38:30'),
(110, 1, 'EBOOK_DELETED', 'EBOOK', 3, 'Biology for Lower Secondary', NULL, '2026-09-10 13:38:32'),
(111, 1, 'EBOOK_DELETED', 'EBOOK', 1, 'Mathematics for Grade 7', NULL, '2026-09-10 13:38:35'),
(112, 1, 'EBOOK_DELETED', 'EBOOK', 2, 'English Grammar Essentials', NULL, '2026-09-10 13:38:37'),
(113, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:59:12'),
(114, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:00:27'),
(115, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:00:53'),
(116, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:08:23'),
(117, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:08:36'),
(119, 1, 'EBOOK_UPLOADED', 'EBOOK', 8, 'Biology', NULL, '2026-09-10 14:30:33'),
(123, 1, 'EBOOK_READ', 'EBOOK', 8, 'Biology', NULL, '2026-09-10 14:35:25'),
(124, 1, 'EBOOK_UPLOADED', 'EBOOK', 9, 'Maths', NULL, '2026-09-10 14:36:54'),
(125, 1, 'EBOOK_READ', 'EBOOK', 8, 'Biology', NULL, '2026-09-10 14:36:58'),
(126, 1, 'EBOOK_UPLOADED', 'EBOOK', 10, 'History', NULL, '2026-09-10 14:38:07'),
(127, 1, 'EBOOK_UPLOADED', 'EBOOK', 11, 'Entrepreneurships', NULL, '2026-09-10 14:39:29'),
(128, NULL, 'CRON_FINE_CALC', 'SYSTEM', NULL, '{\"processed\":2,\"users\":2}', NULL, '2026-09-10 14:39:42'),
(129, 1, 'EBOOK_UPLOADED', 'EBOOK', 12, 'Physics ', NULL, '2026-09-10 14:40:55'),
(130, 1, 'EBOOK_UPLOADED', 'EBOOK', 13, 'ICT', NULL, '2026-09-10 14:41:35'),
(131, 1, 'EBOOK_UPLOADED', 'EBOOK', 14, 'French', NULL, '2026-09-10 14:42:24'),
(132, 1, 'EBOOK_UPLOADED', 'EBOOK', 15, 'English', NULL, '2026-09-10 14:43:08'),
(133, 1, 'EBOOK_UPLOADED', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-10 14:44:03'),
(134, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:47:20'),
(135, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:47:34'),
(136, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:47:50'),
(137, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 14:53:42'),
(138, 1, 'EBOOK_UPLOADED', 'EBOOK', 17, '__COVER_TEST__', NULL, '2026-09-10 14:53:42'),
(139, 1, 'EBOOK_DELETED', 'EBOOK', 17, '__COVER_TEST__', NULL, '2026-09-10 14:53:42'),
(140, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 15:04:38'),
(141, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 15:04:46'),
(142, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-10 15:05:29'),
(143, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 15:17:06'),
(144, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 15:25:26'),
(145, 1, 'BOOK_BORROWED', 'BORROWING', 25, '{\"user\":\"STU0003\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-10 15:25:26'),
(146, 1, 'BOOK_RETURNED', 'RETURN', 15, '{\"copy\":\"EBK016-D1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 15:25:26'),
(147, 1, 'BOOK_BORROWED', 'BORROWING', 26, '{\"user\":\"STU0003\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-10 15:25:26'),
(148, 1, 'BOOK_RETURNED', 'RETURN', 16, '{\"copy\":\"EBK016-D1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 15:25:27'),
(149, 1, 'BOOK_BORROWED', 'BORROWING', 27, '{\"user\":\"LIB0001\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-10 15:31:12'),
(150, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 15:38:36'),
(151, 1, 'BOOK_RETURNED', 'RETURN', 17, '{\"copy\":\"EBK016-D1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 15:38:36'),
(152, 1, 'BOOK_BORROWED', 'BORROWING', 28, '{\"user\":\"LIB0001\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-10 15:38:36'),
(153, 1, 'BOOK_RETURNED', 'RETURN', 18, '{\"copy\":\"EBK016-D1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 15:38:36'),
(154, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 05:25:34'),
(155, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-11 06:27:18'),
(156, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 06:29:51'),
(157, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 06:36:52'),
(158, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 09:15:13'),
(159, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 09:16:15'),
(160, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 09:17:37'),
(168, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 09:37:59'),
(201, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 12:02:06'),
(202, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 12:04:03'),
(203, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 12:26:59'),
(204, 1, 'QR_DELETED', 'CARD', 21, 'Deleted card 21 for user 17', NULL, '2026-09-11 13:42:22'),
(205, 1, 'QR_DELETED', 'CARD', 11, 'Deleted card 11 for user 7', NULL, '2026-09-11 13:42:28'),
(206, 1, 'QR_DELETED', 'CARD', 12, 'Deleted card 12 for user 8', NULL, '2026-09-11 13:42:35'),
(207, 1, 'QR_DELETED', 'CARD', 13, 'Deleted card 13 for user 9', NULL, '2026-09-11 13:42:40'),
(208, 1, 'QR_DELETED', 'CARD', 14, 'Deleted card 14 for user 10', NULL, '2026-09-11 13:42:44'),
(209, 1, 'QR_DELETED', 'CARD', 15, 'Deleted card 15 for user 11', NULL, '2026-09-11 13:42:52'),
(210, 1, 'QR_DELETED', 'CARD', 16, 'Deleted card 16 for user 12', NULL, '2026-09-11 13:43:03'),
(211, 1, 'QR_DELETED', 'CARD', 17, 'Deleted card 17 for user 13', NULL, '2026-09-11 13:43:08'),
(212, 1, 'QR_DELETED', 'CARD', 19, 'Deleted card 19 for user 15', NULL, '2026-09-11 13:43:13'),
(213, 1, 'QR_DELETED', 'CARD', 18, 'Deleted card 18 for user 14', NULL, '2026-09-11 13:43:18'),
(214, 1, 'QR_DELETED', 'CARD', 20, 'Deleted card 20 for user 16', NULL, '2026-09-11 13:43:27'),
(215, 1, 'QR_REGENERATED', 'CARD', 22, 'GST0002', NULL, '2026-09-11 13:43:33'),
(216, 1, 'QR_REGENERATED', 'CARD', 23, 'STU0003', NULL, '2026-09-11 13:43:43'),
(217, 1, 'QR_REGENERATED', 'CARD', 24, 'STU0004', NULL, '2026-09-11 13:48:37'),
(218, 1, 'QR_REGENERATED', 'CARD', 25, 'STU0005', NULL, '2026-09-11 13:48:41'),
(219, 1, 'QR_REGENERATED', 'CARD', 26, 'STU0006', NULL, '2026-09-11 13:48:46'),
(220, 1, 'QR_REGENERATED', 'CARD', 27, 'STU0007', NULL, '2026-09-11 13:48:51'),
(221, 1, 'QR_REGENERATED', 'CARD', 28, 'TCH0002', NULL, '2026-09-11 13:48:54'),
(222, 1, 'QR_REGENERATED', 'CARD', 29, 'STU0008', NULL, '2026-09-11 13:48:59'),
(223, 1, 'QR_REGENERATED', 'CARD', 30, 'GST0001', NULL, '2026-09-11 13:49:04'),
(224, 1, 'QR_REGENERATED', 'CARD', 31, 'TCH0003', NULL, '2026-09-11 13:49:10'),
(225, 1, 'QR_REGENERATED', 'CARD', 32, 'TCH0004', NULL, '2026-09-11 13:49:16'),
(231, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 13:57:49'),
(232, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 14:50:49'),
(233, 1, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-11 14:52:52'),
(236, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 15:00:47'),
(242, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 07:18:42'),
(243, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 07:40:44'),
(244, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 08:19:36'),
(245, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 08:19:47'),
(247, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 08:21:10'),
(249, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 08:36:42'),
(250, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 08:41:44'),
(252, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 08:46:02'),
(253, 1, 'USER_CREATED', 'USER', 18, 'Librarian created STUDENT STU0009', NULL, '2026-09-14 08:46:51'),
(254, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 08:48:26'),
(255, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 09:01:53'),
(256, 1, 'USER_CREATED', 'USER', 19, 'Librarian created GUEST GST0003', NULL, '2026-09-14 09:01:53'),
(257, 1, 'PASSWORD_RESET', 'USER', 19, 'Password reset for user 19', NULL, '2026-09-14 09:01:53'),
(259, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 09:05:44'),
(260, 1, 'USER_CREATED', 'USER', 20, 'Librarian created STUDENT STU0010', NULL, '2026-09-14 09:05:45'),
(261, 1, 'PASSWORD_RESET', 'USER', 20, 'Password reset for user 20', NULL, '2026-09-14 09:05:45'),
(263, 1, 'USER_DELETED', 'USER', 20, 'STU0010 deleted by librarian', NULL, '2026-09-14 09:05:45'),
(264, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 09:05:56'),
(265, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 09:06:02'),
(266, 1, 'USER_DELETED', 'USER', 19, 'GST0003 deleted by librarian', NULL, '2026-09-14 09:06:02'),
(267, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 09:36:07'),
(268, 1, 'USER_CREATED', 'USER', 21, 'Librarian created STUDENT STU0010', NULL, '2026-09-14 09:36:07'),
(269, 1, 'USER_DELETED', 'USER', 21, 'STU0010 deleted by librarian', NULL, '2026-09-14 09:36:08'),
(270, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-14 09:36:27'),
(271, 1, 'USER_CREATED', 'USER', 22, 'Librarian created GUEST GST0003', NULL, '2026-09-14 09:36:28'),
(272, 1, 'PASSWORD_RESET', 'USER', 22, 'Password reset for user 22', NULL, '2026-09-14 09:36:28'),
(274, 1, 'USER_DELETED', 'USER', 22, 'GST0003 deleted by librarian', NULL, '2026-09-14 09:36:28'),
(275, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 09:38:18'),
(276, 1, 'USER_DELETED', 'USER', 17, 'GST0002 deleted by librarian', NULL, '2026-09-14 09:38:46'),
(277, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 10:04:29'),
(279, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 12:40:34'),
(281, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-14 14:22:10'),
(286, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-15 05:49:39'),
(288, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-15 06:54:50'),
(289, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-15 07:00:34'),
(290, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-15 07:00:58'),
(291, 1, 'QR_DELETED', 'CARD', 23, 'Deleted card 23 for user 7', NULL, '2026-09-15 07:01:20'),
(292, 1, 'QR_DELETED', 'CARD', 33, 'Deleted card 33 for user 18', NULL, '2026-09-15 07:13:07'),
(293, 1, 'QR_DELETED', 'CARD', 24, 'Deleted card 24 for user 8', NULL, '2026-09-15 07:18:06'),
(294, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-15 07:22:22'),
(295, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-15 07:22:39'),
(296, 1, 'QR_DELETED', 'CARD', 25, 'Deleted card 25 for user 9', NULL, '2026-09-15 07:34:19'),
(297, 1, 'QR_REGENERATED', 'CARD', 38, 'STU0005', NULL, '2026-09-15 07:34:26'),
(298, 1, 'QR_DELETED', 'CARD', 38, 'Deleted card 38 for user 9', NULL, '2026-09-15 07:35:09'),
(299, 1, 'QR_DELETED', 'CARD', 26, 'Deleted card 26 for user 10', NULL, '2026-09-15 08:01:20'),
(300, 1, 'QR_DELETED', 'CARD', 27, 'Deleted card 27 for user 11', NULL, '2026-09-15 08:01:26'),
(301, 1, 'QR_DELETED', 'CARD', 29, 'Deleted card 29 for user 12', NULL, '2026-09-15 08:01:41'),
(302, 1, 'QR_DELETED', 'CARD', 28, 'Deleted card 28 for user 13', NULL, '2026-09-15 08:01:45'),
(303, 1, 'QR_DELETED', 'CARD', 31, 'Deleted card 31 for user 14', NULL, '2026-09-15 08:01:49'),
(304, 1, 'QR_DELETED', 'CARD', 32, 'Deleted card 32 for user 15', NULL, '2026-09-15 08:01:53'),
(305, 1, 'QR_DELETED', 'CARD', 30, 'Deleted card 30 for user 16', NULL, '2026-09-15 08:01:56'),
(306, 1, 'QR_DELETED', 'CARD', 8, 'Deleted card 8 for user 6', NULL, '2026-09-15 08:06:29'),
(307, 1, 'QR_DELETED', 'CARD', 9, 'Deleted card 9 for user 4', NULL, '2026-09-15 08:06:34'),
(308, 1, 'QR_DELETED', 'CARD', 10, 'Deleted card 10 for user 5', NULL, '2026-09-15 08:06:37'),
(309, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-15 09:07:22'),
(310, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-15 09:09:10'),
(311, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-15 09:11:35'),
(312, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-15 09:11:46'),
(313, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-15 09:12:10'),
(314, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-15 09:52:20'),
(315, 1, 'USER_DELETED', 'USER', 18, 'STU0009 deleted by librarian', NULL, '2026-09-15 10:42:29'),
(316, 1, 'USER_DELETED', 'USER', 7, 'STU0003 deleted by librarian', NULL, '2026-09-15 10:42:34'),
(317, 1, 'USER_DELETED', 'USER', 13, 'TCH0002 deleted by librarian', NULL, '2026-09-15 12:46:10'),
(318, 1, 'USER_DELETED', 'USER', 14, 'TCH0003 deleted by librarian', NULL, '2026-09-15 12:46:14'),
(319, 1, 'USER_DELETED', 'USER', 11, 'STU0007 deleted by librarian', NULL, '2026-09-15 12:46:22'),
(320, 1, 'USER_DELETED', 'USER', 5, 'TCH0001 deleted by librarian', NULL, '2026-09-15 12:46:38'),
(321, 1, 'USER_DELETED', 'USER', 16, 'GST0001 deleted by librarian', NULL, '2026-09-15 12:47:04'),
(322, 1, 'USER_DELETED', 'USER', 12, 'STU0008 deleted by librarian', NULL, '2026-09-15 12:47:08'),
(323, 1, 'USER_DELETED', 'USER', 10, 'STU0006 deleted by librarian', NULL, '2026-09-15 12:47:10'),
(324, 1, 'USER_DELETED', 'USER', 9, 'STU0005 deleted by librarian', NULL, '2026-09-15 12:47:13'),
(325, 1, 'USER_DELETED', 'USER', 15, 'TCH0004 deleted by librarian', NULL, '2026-09-15 12:47:15'),
(326, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-15 12:49:46'),
(327, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-15 12:50:17'),
(328, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-15 13:00:58'),
(329, 1, 'USER_CREATED', 'USER', 23, 'Librarian created STUDENT STU0005', NULL, '2026-09-15 13:05:45'),
(330, 1, 'USER_DELETED', 'USER', 23, 'STU0005 deleted by librarian', NULL, '2026-09-15 13:08:32'),
(331, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-15 13:11:43'),
(332, 1, 'USER_DELETED', 'USER', 8, 'STU0004 deleted by librarian', NULL, '2026-09-15 13:37:50'),
(333, 1, 'QR_REGENERATED', 'CARD', 40, 'STU0001', NULL, '2026-09-15 13:59:08'),
(334, 1, 'QR_DELETED', 'CARD', 40, 'Deleted card 40 for user 4', NULL, '2026-09-15 14:04:38'),
(335, 1, 'USER_UPDATED', 'USER', 6, '{\"first_name\":\"mugabo\",\"last_name\":\"patrick\",\"email\":\"patrick@hopehaven.edu\",\"phone\":\"0788888888888\",\"role\":\"STUDENT\",\"status\":\"ACTIVE\"}', NULL, '2026-09-15 14:25:48'),
(336, 1, 'USER_DELETED', 'USER', 6, 'STU0002 deleted by librarian', NULL, '2026-09-15 14:31:51'),
(337, 1, 'USER_DELETED', 'USER', 4, 'STU0001 deleted by librarian', NULL, '2026-09-15 14:31:54'),
(338, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-16 07:19:18'),
(339, 1, 'USER_CREATED', 'USER', 24, 'Librarian created TEACHER TCH0001', NULL, '2026-09-16 07:45:01'),
(340, 1, 'USER_DELETED', 'USER', 24, 'TCH0001 deleted by librarian', NULL, '2026-09-16 08:06:11'),
(341, 1, 'USER_CREATED', 'USER', 26, 'Librarian created STUDENT STU0001', NULL, '2026-09-16 08:07:00'),
(342, 1, 'USER_DELETED', 'USER', 26, 'STU0001 deleted by librarian', NULL, '2026-09-16 08:14:49'),
(343, 1, 'USER_CREATED', 'USER', 27, 'Librarian created STUDENT STU0001', NULL, '2026-09-16 08:15:41'),
(344, 1, 'QR_REGENERATED', 'CARD', 44, 'STU0001', NULL, '2026-09-16 08:58:08'),
(345, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-16 09:11:30'),
(346, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-16 09:15:28'),
(347, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-16 09:17:06'),
(348, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-16 10:15:11'),
(349, 1, 'QR_DELETED', 'CARD', 44, 'Deleted card 44 for user 27', NULL, '2026-09-16 10:15:34'),
(350, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-16 10:34:47'),
(351, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-16 10:34:58'),
(352, 1, 'USER_DELETED', 'USER', 27, 'STU0001 deleted by librarian', NULL, '2026-09-16 10:47:21'),
(353, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-16 13:00:29'),
(354, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 05:27:13'),
(355, 1, 'USER_CREATED', 'USER', 28, 'Librarian created STUDENT STU0001', NULL, '2026-09-17 05:29:39'),
(356, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 05:33:00'),
(357, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 05:33:42'),
(358, 1, 'BOOK_BORROWED', 'BORROWING', 41, '{\"user\":\"STU0001\",\"copy\":\"EBK015-D1\"}', NULL, '2026-09-17 05:34:22'),
(359, 1, 'BOOK_RETURNED', 'RETURN', 24, '{\"copy\":\"EBK015-D1\",\"fine\":10000,\"condition\":\"DAMAGED\"}', NULL, '2026-09-17 05:35:54'),
(360, 1, 'FINE_PAID', 'FINE', 9, '10000.00 via CASH', NULL, '2026-09-17 05:36:40'),
(361, 1, 'EBOOK_PROTECTION', 'EBOOK', 15, 'Unprotected (download allowed)', NULL, '2026-09-17 05:36:56'),
(362, 1, 'EBOOK_PROTECTION', 'EBOOK', 15, 'Protected (read-only)', NULL, '2026-09-17 05:37:05'),
(363, 1, 'EBOOK_PROTECTION', 'EBOOK', 15, 'Unprotected (download allowed)', NULL, '2026-09-17 05:37:08'),
(364, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 06:55:13'),
(365, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 06:58:51'),
(366, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 07:09:59'),
(367, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 07:14:42'),
(368, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 07:34:59'),
(369, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 07:42:52'),
(370, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 07:56:07'),
(371, 1, 'USER_CREATED', 'USER', 29, 'Librarian created STUDENT STU0002', NULL, '2026-09-17 07:59:16'),
(377, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 08:27:43'),
(378, 1, 'USER_DELETED', 'USER', 28, 'STU0001 deleted by librarian', NULL, '2026-09-17 08:29:11'),
(379, 1, 'USER_DELETED', 'USER', 29, 'STU0002 deleted by librarian', NULL, '2026-09-17 08:29:15'),
(380, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 08:53:43'),
(381, 1, 'USER_CREATED', 'USER', 30, 'Librarian created STUDENT STU0001', NULL, '2026-09-17 09:16:13'),
(383, 1, 'USER_CREATED', 'USER', 31, 'Librarian created TEACHER TCH0001', NULL, '2026-09-17 09:18:43'),
(384, 1, 'QR_REGENERATED', 'CARD', 49, 'TCH0001', NULL, '2026-09-17 09:56:29'),
(385, 1, 'QR_DELETED', 'CARD', 47, 'Deleted card 47 for user 30', NULL, '2026-09-17 09:56:36'),
(387, 1, 'QR_REGENERATED', 'CARD', 50, 'STU0001', NULL, '2026-09-17 09:57:09'),
(388, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-17 10:10:58'),
(389, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-17 10:10:58'),
(390, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-17 10:18:01'),
(391, 31, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-17 10:19:14'),
(392, 31, 'EBOOK_DOWNLOAD', 'EBOOK', 15, '{\"title\":\"English\",\"format\":\"PDF\"}', NULL, '2026-09-17 10:19:30'),
(393, 31, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 10:19:58'),
(394, 31, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-17 10:20:10'),
(395, 31, 'EBOOK_READ', 'EBOOK', 13, 'ICT', NULL, '2026-09-17 10:20:15'),
(396, 31, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-17 10:20:30'),
(397, 31, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-17 10:33:52'),
(398, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-17 11:04:32'),
(399, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-17 13:06:34'),
(400, 31, 'BOOK_BORROWED', 'BORROWING', 43, '{\"user\":\"TCH0001\",\"copy\":\"EBK014-D1\"}', NULL, '2026-09-17 13:08:08'),
(401, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 13:08:55'),
(402, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-17 13:29:55'),
(403, 1, 'EBOOK_READ', 'EBOOK', 8, 'Biology', NULL, '2026-09-17 13:30:14'),
(404, 1, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-17 13:51:25'),
(405, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Unprotected (download allowed)', NULL, '2026-09-17 13:51:48'),
(406, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Protected (read-only)', NULL, '2026-09-17 13:51:53'),
(407, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Unprotected (download allowed)', NULL, '2026-09-17 13:52:00'),
(408, 31, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 13:52:23'),
(409, 31, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 13:52:31'),
(410, 31, 'BOOK_RETURNED', 'RETURN', 25, '{\"copy\":\"EBK014-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-17 14:04:10'),
(411, 31, 'BOOK_REQUESTED', 'BORROWING', 44, '{\"user\":\"TCH0001\",\"copy\":\"BOOK036-C1\",\"pending\":true}', NULL, '2026-09-17 14:04:25'),
(412, 1, 'BORROW_APPROVED', 'BORROWING', 44, '{\"user\":\"TCH0001\",\"copy\":\"BOOK036-C1\"}', NULL, '2026-09-17 14:10:31'),
(413, 31, 'BOOK_REQUESTED', 'BORROWING', 45, '{\"user\":\"TCH0001\",\"copy\":\"BOOK033-C1\",\"pending\":true}', NULL, '2026-09-17 14:24:04'),
(414, 1, 'BORROW_REJECTED', 'BORROWING', 45, '{\"user\":\"TCH0001\",\"copy\":\"BOOK033-C1\"}', NULL, '2026-09-17 14:24:21'),
(415, 31, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 14:53:44'),
(416, 31, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-17 14:53:57'),
(417, 31, 'BOOK_REQUESTED', 'BORROWING', 46, '{\"user\":\"TCH0001\",\"copy\":\"BOOK034-C1\",\"pending\":true}', NULL, '2026-09-17 15:00:15'),
(418, 1, 'BORROW_APPROVED', 'BORROWING', 46, '{\"user\":\"TCH0001\",\"copy\":\"BOOK034-C1\"}', NULL, '2026-09-17 15:04:52'),
(419, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-18 05:31:47'),
(420, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-18 05:36:55'),
(421, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Protected (read-only)', NULL, '2026-09-18 06:22:25'),
(422, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-18 06:22:36'),
(423, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-18 06:29:40'),
(424, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Unprotected (download allowed)', NULL, '2026-09-18 06:29:44'),
(425, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Protected (read-only)', NULL, '2026-09-18 06:29:45'),
(426, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Unprotected (download allowed)', NULL, '2026-09-18 06:29:45'),
(427, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-18 06:29:46'),
(428, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Protected (read-only)', NULL, '2026-09-18 06:29:54'),
(429, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Unprotected (download allowed)', NULL, '2026-09-18 06:29:56'),
(430, 1, 'EBOOK_PROTECTION', 'EBOOK', 16, 'Protected (read-only)', NULL, '2026-09-18 06:29:57'),
(431, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-18 06:45:29'),
(432, 1, 'BOOK_BORROWED', 'BORROWING', 47, '{\"user\":\"LIB0001\",\"copy\":\"BOOK033-C1\"}', NULL, '2026-09-18 07:15:40'),
(433, 30, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-18 07:16:24'),
(434, 30, 'BOOK_REQUESTED', 'BORROWING', 48, '{\"user\":\"STU0001\",\"copy\":\"BOOK039-C1\",\"pending\":true}', NULL, '2026-09-18 07:17:26'),
(435, 1, 'BORROW_APPROVED', 'BORROWING', 48, '{\"user\":\"STU0001\",\"copy\":\"BOOK039-C1\"}', NULL, '2026-09-18 07:17:53'),
(436, 1, 'BOOK_RETURNED', 'RETURN', 26, '{\"copy\":\"BOOK039-C1\",\"fine\":10000,\"condition\":\"DAMAGED\"}', NULL, '2026-09-18 07:40:01'),
(437, 1, 'BOOK_RETURNED', 'RETURN', 27, '{\"copy\":\"BOOK036-C1\",\"fine\":10000,\"condition\":\"DAMAGED\"}', NULL, '2026-09-18 08:05:07'),
(438, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-18 10:11:01'),
(439, 1, 'BOOK_RETURNED', 'RETURN', 28, '{\"copy\":\"BOOK034-C1\",\"fine\":10000,\"condition\":\"DAMAGED\"}', NULL, '2026-09-18 12:55:49'),
(440, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-18 13:16:32'),
(441, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-18 13:29:11'),
(442, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-18 13:30:23'),
(443, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-21 05:35:26'),
(444, 30, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-21 05:35:53'),
(445, 30, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-21 05:36:17'),
(446, 1, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-21 05:36:34'),
(447, 30, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-21 05:37:05'),
(448, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-21 06:17:52'),
(449, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-21 06:18:25'),
(450, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-21 06:18:45'),
(451, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-21 06:37:06'),
(452, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-21 06:37:16'),
(453, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-21 06:37:27'),
(454, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-21 06:37:46'),
(455, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-21 06:43:11'),
(456, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-21 06:50:45'),
(457, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-21 06:58:04'),
(458, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-21 07:00:09'),
(459, 1, 'USER_CREATED', 'USER', 32, 'Librarian created STUDENT STU0002', NULL, '2026-09-21 07:00:10'),
(460, NULL, 'USER_LOGIN', 'USER', 32, 'Login successful', NULL, '2026-09-21 07:00:10'),
(461, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-21 08:20:40'),
(462, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-21 08:37:49'),
(463, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 05:19:28'),
(464, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-22 05:22:00'),
(465, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-22 05:22:34'),
(466, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-22 05:23:21'),
(467, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-22 05:41:59'),
(468, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 05:44:03'),
(469, 1, 'QR_DELETED', 'CARD', 4, 'Deleted card 4 for user 1', NULL, '2026-09-22 07:16:12'),
(470, 1, 'QR_DELETED', 'CARD', 50, 'Deleted card 50 for user 30', NULL, '2026-09-22 07:17:28'),
(471, 1, 'QR_DELETED', 'CARD', 49, 'Deleted card 49 for user 31', NULL, '2026-09-22 07:17:31'),
(472, 1, 'QR_DELETED', 'CARD', 51, 'Deleted card 51 for user 32', NULL, '2026-09-22 07:17:33'),
(473, 1, 'QR_REGENERATED', 'CARD', 52, 'LIB0001', NULL, '2026-09-22 07:17:44'),
(474, 1, 'QR_REGENERATED', 'CARD', 53, 'STU0001', NULL, '2026-09-22 07:17:49'),
(475, 1, 'QR_REGENERATED', 'CARD', 54, 'TCH0001', NULL, '2026-09-22 07:17:54'),
(476, 1, 'QR_REGENERATED', 'CARD', 55, 'STU0002', NULL, '2026-09-22 07:17:58'),
(477, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-22 08:40:56'),
(478, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 10:40:47'),
(479, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-22 10:46:26'),
(480, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 10:56:23'),
(481, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-22 10:56:23'),
(482, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-22 10:56:23'),
(483, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-22 10:56:23'),
(484, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-22 11:07:04'),
(485, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-22 12:09:10'),
(486, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-22 12:09:10'),
(487, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-22 12:10:06'),
(488, 1, 'QR_REGENERATED', 'CARD', 56, 'LIB0001', NULL, '2026-09-22 12:10:07'),
(489, 1, 'QR_REGENERATED', 'CARD', 57, 'STU0001', NULL, '2026-09-22 12:10:07'),
(490, 1, 'QR_REGENERATED', 'CARD', 58, 'TCH0001', NULL, '2026-09-22 12:10:07'),
(491, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-22 12:11:03'),
(492, 1, 'QR_REGENERATED', 'CARD', 59, 'LIB0001', NULL, '2026-09-22 12:11:03'),
(493, 1, 'QR_REGENERATED', 'CARD', 60, 'STU0001', NULL, '2026-09-22 12:11:03'),
(494, 1, 'QR_REGENERATED', 'CARD', 61, 'TCH0001', NULL, '2026-09-22 12:11:03'),
(495, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 12:12:58'),
(496, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-22 12:12:58'),
(497, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-22 12:51:35'),
(498, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-22 12:51:35'),
(499, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 12:52:08'),
(500, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-22 13:05:13'),
(501, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-22 15:06:29'),
(502, 1, 'USER_UPDATED', 'USER', 1, '{\"physical_card_no\":\"19848518\"}', NULL, '2026-09-22 15:06:29'),
(503, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-22 15:06:29'),
(504, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:40:33'),
(505, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:48:21'),
(506, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:48:21'),
(507, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:49:39'),
(508, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:49:39'),
(509, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:49:39'),
(510, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:49:39'),
(511, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 05:49:39'),
(512, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-23 08:20:37'),
(513, NULL, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-23 08:28:47'),
(514, NULL, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-23 08:39:46'),
(515, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 08:42:38'),
(516, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-23 08:42:52'),
(517, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-23 08:42:52'),
(518, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 08:42:52'),
(519, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-23 08:42:52'),
(520, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 08:42:52'),
(521, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 08:42:52'),
(522, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 09:06:17'),
(523, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 09:06:17'),
(524, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 09:08:56'),
(525, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 09:13:11'),
(526, 1, 'QR_UPDATED', 'CARD', 59, '{\"status\":\"ACTIVE\",\"card_number\":\"HH-LIB0001-MUCMUT08\"}', NULL, '2026-09-23 09:14:00'),
(527, 1, 'USER_UPDATED', 'USER', 1, '{\"first_name\":\"System\",\"last_name\":\"Administrator\",\"email\":\"librarian@hopehaven.edu\",\"phone\":\"0788000000\",\"role\":\"LIBRARIAN\",\"status\":\"ACTIVE\",\"class_name\":\"\",\"physical_card_no\":\"11028192\"}', NULL, '2026-09-23 09:14:00'),
(528, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 09:17:06'),
(529, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 10:22:19'),
(530, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 13:26:13'),
(531, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 14:35:34'),
(532, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-23 14:35:35'),
(533, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-23 14:35:35'),
(534, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-23 14:35:35'),
(535, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-23 14:53:16'),
(536, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-23 15:05:18'),
(537, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-24 05:10:06'),
(538, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-24 05:10:26'),
(539, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-24 05:48:56'),
(540, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'READ_BORROW', NULL, '2026-09-24 05:49:09'),
(541, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-24 05:49:21'),
(542, 30, 'BOOK_BORROWED', 'BORROWING', 49, '{\"user\":\"STU0001\",\"copy\":\"EBK008-D1\"}', NULL, '2026-09-24 05:50:04'),
(543, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 10, 'BORROW_ONLY', NULL, '2026-09-24 05:50:16'),
(544, 30, 'BOOK_BORROWED', 'BORROWING', 50, '{\"user\":\"STU0001\",\"copy\":\"EBK010-D1\"}', NULL, '2026-09-24 05:50:17'),
(545, 30, 'EBOOK_READ', 'EBOOK', 10, 'History', NULL, '2026-09-24 05:50:17'),
(546, 30, 'BOOK_RETURNED', 'RETURN', 29, '{\"copy\":\"EBK008-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-24 05:51:05'),
(547, 30, 'BOOK_RETURNED', 'RETURN', 30, '{\"copy\":\"EBK010-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-24 05:51:05'),
(548, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'READ_ONLY', NULL, '2026-09-24 05:51:17'),
(549, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 15, 'READ_ONLY', NULL, '2026-09-24 05:51:17'),
(550, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 14, 'READ_ONLY', NULL, '2026-09-24 05:51:17'),
(551, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 13, 'READ_BORROW', NULL, '2026-09-24 05:51:17'),
(552, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 12, 'READ_ONLY', NULL, '2026-09-24 05:51:17'),
(553, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 11, 'READ_ONLY', NULL, '2026-09-24 05:51:17'),
(554, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 10, 'BORROW_ONLY', NULL, '2026-09-24 05:51:17'),
(555, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 9, 'READ_BORROW', NULL, '2026-09-24 05:51:17'),
(556, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'READ_BORROW', NULL, '2026-09-24 05:51:17'),
(557, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'READ_ONLY', NULL, '2026-09-24 05:55:12'),
(558, NULL, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-24 05:56:18'),
(559, NULL, 'EBOOK_READ', 'EBOOK', 8, 'Biology', NULL, '2026-09-24 05:56:56'),
(560, NULL, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-24 06:39:25'),
(561, NULL, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-24 06:49:46'),
(562, NULL, 'EBOOK_READ', 'EBOOK', 12, 'Physics ', NULL, '2026-09-24 06:51:41'),
(563, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'READ_BORROW', NULL, '2026-09-24 07:42:17'),
(564, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'READ_ONLY', NULL, '2026-09-24 07:42:19'),
(565, 1, 'BOOK_RETURNED', 'RETURN', 31, '{\"copy\":\"BOOK033-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-24 08:26:24'),
(566, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-24 09:29:24'),
(567, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-24 09:31:26'),
(568, NULL, 'BOOK_BORROWED', 'BORROWING', 51, '{\"user\":\"STU0002\",\"copy\":\"EBK013-D1\"}', NULL, '2026-09-24 12:28:53'),
(569, NULL, 'EBOOK_DOWNLOADED', 'EBOOK', 13, 'ICT', NULL, '2026-09-24 12:28:53'),
(570, NULL, 'BOOK_BORROWED', 'BORROWING', 52, '{\"user\":\"STU0002\",\"copy\":\"EBK008-D1\"}', NULL, '2026-09-24 12:54:37'),
(571, NULL, 'EBOOK_DOWNLOADED', 'EBOOK', 8, 'Biology', NULL, '2026-09-24 12:54:37'),
(572, NULL, 'BOOK_BORROWED', 'BORROWING', 53, '{\"user\":\"STU0002\",\"copy\":\"EBK009-D1\"}', NULL, '2026-09-24 13:18:22'),
(573, NULL, 'EBOOK_DOWNLOADED', 'EBOOK', 9, 'Maths', NULL, '2026-09-24 13:18:22'),
(574, NULL, 'BOOK_RETURNED', 'RETURN', 32, '{\"copy\":\"EBK009-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-24 13:18:52'),
(575, NULL, 'BOOK_RETURNED', 'RETURN', 33, '{\"copy\":\"EBK008-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-24 13:18:56'),
(576, NULL, 'BOOK_RETURNED', 'RETURN', 34, '{\"copy\":\"EBK013-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-24 13:18:59'),
(577, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'READ_BORROW', NULL, '2026-09-24 13:29:25'),
(578, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 15, 'READ_BORROW', NULL, '2026-09-24 13:29:29'),
(579, 1, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-24 13:29:32'),
(580, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 14, 'READ_BORROW', NULL, '2026-09-24 13:29:36'),
(581, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 9, 'BORROW_ONLY', NULL, '2026-09-24 13:29:51'),
(582, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'BORROW_ONLY', NULL, '2026-09-24 13:29:56'),
(583, NULL, 'BOOK_BORROWED', 'BORROWING', 54, '{\"user\":\"STU0002\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-24 13:30:34'),
(584, NULL, 'EBOOK_DOWNLOADED', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-24 13:30:34'),
(585, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-25 05:34:47'),
(586, 1, 'CATEGORY_ADDED', 'CATEGORY', 9, 'Test Cat', NULL, '2026-09-25 08:12:21'),
(587, 1, 'SUBJECT_ADDED', 'SUBJECT', 1, 'Algebra (S3) - CCB', NULL, '2026-09-25 08:12:34'),
(588, 1, 'CATEGORY_DELETED', 'CATEGORY', 9, 'Test Cat', NULL, '2026-09-25 08:12:48'),
(589, 1, 'SUBJECT_DELETED', 'SUBJECT', 513, 'Algebra (S3)', NULL, '2026-09-25 08:12:48'),
(590, 1, 'CATEGORY_UPDATED', 'CATEGORY', 1, 'CCB', NULL, '2026-09-25 08:22:45'),
(591, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'BORROW_ONLY', NULL, '2026-09-25 09:58:58'),
(592, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 16, 'READ_ONLY', NULL, '2026-09-25 09:59:06'),
(593, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-25 11:17:22'),
(594, 1, 'SUBJECT_DELETED', 'SUBJECT', 88, 'Physics (S1)', NULL, '2026-09-25 12:37:37'),
(595, 1, 'EBOOK_UPLOADED', 'EBOOK', 2, 'Test Book', NULL, '2026-09-25 14:40:07'),
(596, 1, 'EBOOK_UPLOADED', 'EBOOK', 3, 'Test Book 2', NULL, '2026-09-25 14:40:38'),
(600, 1, 'EBOOK_UPLOADED', 'EBOOK', 1, 'LiveTestFinal', NULL, '2026-09-25 15:54:27'),
(601, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-28 06:35:08'),
(602, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-28 06:35:41'),
(603, 1, 'EBOOK_UPLOADED', 'EBOOK', 2, 'TodayTest', NULL, '2026-09-28 06:42:52'),
(604, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-28 06:55:55'),
(615, 1, 'EBOOK_UPLOADED', 'EBOOK', 8, 'Biology S1', NULL, '2026-09-28 07:34:02'),
(616, 1, 'BOOK_ADDED', 'BOOK', 1, 'BarcodeTest, 1 copies', NULL, '2026-09-28 07:49:08'),
(617, 1, 'BOOK_ADDED', 'BOOK', 2, 'Scanner HardBook Test, 2 copies', NULL, '2026-09-28 08:34:01'),
(618, 1, 'BOOK_ADDED', 'BOOK', 3, 'Advanced Biology S1, 3 copies', NULL, '2026-09-28 08:48:08'),
(619, 1, 'BOOK_ADDED', 'BOOK', 4, 'Holy Bible - New Testament, 2 copies', NULL, '2026-09-28 08:48:08'),
(620, 1, 'BOOK_ADDED', 'BOOK', 5, 'Collins Primary English 4, 1 copies', NULL, '2026-09-28 08:48:08'),
(621, 1, 'BOOK_ADDED', 'BOOK', 6, 'Biology S1, 45 copies', NULL, '2026-09-28 09:14:43'),
(622, 1, 'BOOK_ADDED', 'BOOK', 7, 'Biology S1, 19 copies', NULL, '2026-09-28 10:49:59'),
(623, NULL, 'BOOK_REQUESTED', 'BORROWING', 1, '{\"user\":\"STU0002\",\"copy\":\"BK-BIOL-S1\",\"pending\":true}', NULL, '2026-09-28 10:50:43'),
(624, 1, 'BORROW_APPROVED', 'BORROWING', 1, '{\"user\":\"STU0002\",\"copy\":\"BK-BIOL-S1\"}', NULL, '2026-09-28 10:58:16'),
(625, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-28 12:00:28'),
(626, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-28 12:01:02'),
(627, 1, 'BOOK_DELETED', 'BOOK', 8, 'ZZ Temp Delete Test - 2 copies deleted', NULL, '2026-09-28 12:37:29'),
(628, 1, 'BOOK_DELETED', 'BOOK', 7, 'Biology S1 - 19 copies deleted', NULL, '2026-09-28 12:40:10'),
(629, 1, 'BOOK_DELETED', 'BOOK', 6, 'Biology S1 - 45 copies deleted', NULL, '2026-09-28 12:40:12'),
(630, 1, 'BOOK_DELETED', 'BOOK', 4, 'Holy Bible - New Testament - 2 copies deleted', NULL, '2026-09-28 12:40:23'),
(631, 1, 'BOOK_DELETED', 'BOOK', 5, 'Collins Primary English 4 - 1 copy deleted', NULL, '2026-09-28 12:40:26'),
(632, 1, 'BOOK_RETURNED', 'RETURN', 1, '{\"copy\":\"BK-BIOL-S1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-28 12:54:11'),
(633, NULL, 'BOOK_REQUESTED', 'BORROWING', 3, '{\"user\":\"STU0002\",\"copy\":\"BK-BIOL-S1\",\"pending\":true}', NULL, '2026-09-28 13:15:29'),
(634, 1, 'BORROW_APPROVED', 'BORROWING', 3, '{\"user\":\"STU0002\",\"copy\":\"BK-BIOL-S1\"}', NULL, '2026-09-28 13:16:22'),
(635, NULL, 'BOOK_RETURNED', 'RETURN', 2, '{\"copy\":\"BK-BIOL-S1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-28 13:16:51'),
(636, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'BORROW_ONLY', NULL, '2026-09-28 13:18:26'),
(638, 1, 'BOOK_BORROWED', 'BORROWING', 4, '{\"user\":\"STU0002\",\"copy\":\"BKSDFGHJKLGS1\"}', NULL, '2026-09-28 14:55:23'),
(639, 1, 'BOOK_RETURNED', 'RETURN', 3, '{\"copy\":\"BKSDFGHJKLGS1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-28 14:55:48'),
(640, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-29 05:43:55'),
(641, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 05:44:36'),
(642, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-29 06:25:08'),
(643, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 06:25:58'),
(645, NULL, 'BOOK_REQUESTED', 'BORROWING', 5, '{\"user\":\"STU0002\",\"copy\":\"BOOK010-C1\",\"pending\":true}', NULL, '2026-09-29 06:35:20'),
(646, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-29 06:44:03'),
(647, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 06:44:23'),
(649, NULL, 'BOOK_REQUESTED', 'BORROWING', 6, '{\"user\":\"STU0002\",\"copy\":\"BKMMMMMMGS1-NE1MC2V8\",\"pending\":true}', NULL, '2026-09-29 06:56:30'),
(650, 1, 'BORROW_REJECTED', 'BORROWING', 5, '{\"user\":\"STU0002\",\"copy\":\"BOOK010-C1\"}', NULL, '2026-09-29 06:56:52'),
(651, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 07:07:22'),
(652, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-29 07:07:34'),
(653, 1, 'BORROW_APPROVED', 'BORROWING', 6, '{\"user\":\"STU0002\",\"copy\":\"BKMMMMMMGS1-NE1MC2V8\"}', NULL, '2026-09-29 07:09:33'),
(654, NULL, 'BOOK_RETURNED', 'RETURN', 4, '{\"copy\":\"BKMMMMMMGS1-NE1MC2V8\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-29 07:11:02'),
(657, NULL, 'USER_LOGIN', 'USER', 34, 'Login successful', NULL, '2026-09-29 07:40:17'),
(659, NULL, 'BOOK_BORROWED', 'BORROWING', 7, '{\"user\":\"BPSTU67617304\",\"copy\":\"BOOK013-C1\"}', NULL, '2026-09-29 07:40:17'),
(660, NULL, 'BOOK_RETURNED', 'RETURN', 5, '{\"copy\":\"BOOK013-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 07:40:17'),
(683, NULL, 'USER_LOGIN', 'USER', 43, 'Login successful', NULL, '2026-09-29 10:10:05'),
(690, NULL, 'USER_LOGIN', 'USER', 44, 'Login successful', NULL, '2026-09-29 10:13:39'),
(697, NULL, 'USER_LOGIN', 'USER', 45, 'Login successful', NULL, '2026-09-29 10:16:50'),
(704, NULL, 'USER_LOGIN', 'USER', 46, 'Login successful', NULL, '2026-09-29 10:20:10'),
(706, NULL, 'BOOK_BORROWED', 'BORROWING', 12, '{\"user\":\"BPSTU77210482\",\"copy\":\"BOOK030-C1\"}', NULL, '2026-09-29 10:20:10'),
(707, NULL, 'BOOK_RETURNED', 'RETURN', 8, '{\"copy\":\"BOOK030-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 10:20:10'),
(708, NULL, 'USER_LOGIN', 'USER', 48, 'Login successful', NULL, '2026-09-29 12:01:52');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(715, NULL, 'USER_LOGIN', 'USER', 49, 'Login successful', NULL, '2026-09-29 12:02:04'),
(717, NULL, 'BOOK_BORROWED', 'BORROWING', 13, '{\"user\":\"BPSTU83324726\",\"copy\":\"BOOK034-C1\"}', NULL, '2026-09-29 12:02:04'),
(718, NULL, 'BOOK_RETURNED', 'RETURN', 9, '{\"copy\":\"BOOK034-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 12:02:04'),
(719, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 12:44:46'),
(720, NULL, 'USER_LOGIN', 'USER', 51, 'Login successful', NULL, '2026-09-29 12:50:48'),
(721, NULL, 'USER_LOGIN', 'USER', 52, 'Login successful', NULL, '2026-09-29 12:50:48'),
(727, NULL, 'BOOK_REQUESTED', 'BORROWING', 14, '{\"user\":\"STU8374\",\"copy\":\"97807195331374\",\"pending\":true}', NULL, '2026-09-29 12:50:49'),
(729, NULL, 'BOOK_REQUESTED', 'BORROWING', 15, '{\"user\":\"STU8374\",\"copy\":\"97802620338374\",\"pending\":true}', NULL, '2026-09-29 12:50:49'),
(732, NULL, 'USER_LOGIN', 'USER', 53, 'Login successful', NULL, '2026-09-29 12:54:55'),
(733, NULL, 'USER_LOGIN', 'USER', 54, 'Login successful', NULL, '2026-09-29 12:54:55'),
(739, NULL, 'BOOK_REQUESTED', 'BORROWING', 16, '{\"user\":\"STU3870\",\"copy\":\"97807195331870\",\"pending\":true}', NULL, '2026-09-29 12:54:55'),
(743, NULL, 'USER_LOGIN', 'USER', 55, 'Login successful', NULL, '2026-09-29 12:57:30'),
(744, NULL, 'USER_LOGIN', 'USER', 56, 'Login successful', NULL, '2026-09-29 12:57:30'),
(750, NULL, 'BOOK_BORROWED', 'BORROWING', 17, '{\"user\":\"STU9867\",\"copy\":\"97807195331867\"}', NULL, '2026-09-29 12:57:30'),
(751, NULL, 'BOOK_RETURNED', 'RETURN', 10, '{\"copy\":\"97807195331867\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 12:57:30'),
(753, NULL, 'BOOK_BORROWED', 'BORROWING', 18, '{\"user\":\"STU9867\",\"copy\":\"97802620338867\"}', NULL, '2026-09-29 12:57:30'),
(754, NULL, 'BOOK_RETURNED', 'RETURN', 11, '{\"copy\":\"97802620338867\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 12:57:30'),
(755, NULL, 'USER_LOGIN', 'USER', 57, 'Login successful', NULL, '2026-09-29 12:58:06'),
(756, NULL, 'USER_LOGIN', 'USER', 58, 'Login successful', NULL, '2026-09-29 12:58:06'),
(762, NULL, 'BOOK_BORROWED', 'BORROWING', 19, '{\"user\":\"STU6716\",\"copy\":\"97807195331716\"}', NULL, '2026-09-29 12:58:07'),
(763, NULL, 'BOOK_RETURNED', 'RETURN', 12, '{\"copy\":\"97807195331716\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 12:58:07'),
(765, NULL, 'BOOK_BORROWED', 'BORROWING', 20, '{\"user\":\"STU6716\",\"copy\":\"97802620338716\"}', NULL, '2026-09-29 12:58:07'),
(766, NULL, 'BOOK_RETURNED', 'RETURN', 13, '{\"copy\":\"97802620338716\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 12:58:07'),
(767, NULL, 'USER_LOGIN', 'USER', 59, 'Login successful', NULL, '2026-09-29 13:03:08'),
(769, NULL, 'BOOK_BORROWED', 'BORROWING', 21, '{\"user\":\"BPSTU86988701\",\"copy\":\"BOOK043-C1\"}', NULL, '2026-09-29 13:03:08'),
(770, NULL, 'BOOK_RETURNED', 'RETURN', 14, '{\"copy\":\"BOOK043-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 13:03:08'),
(771, NULL, 'USER_LOGIN', 'USER', 61, 'Login successful', NULL, '2026-09-29 13:03:29'),
(778, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 13:13:41'),
(779, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 13:20:20'),
(780, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-29 13:31:44'),
(782, NULL, 'USER_LOGIN', 'USER', 62, 'Login successful', NULL, '2026-09-29 14:13:39'),
(788, NULL, 'USER_LOGIN', 'USER', 63, 'Login successful', NULL, '2026-09-29 14:13:59'),
(789, NULL, 'USER_LOGIN', 'USER', 64, 'Login successful', NULL, '2026-09-29 14:14:00'),
(795, NULL, 'BOOK_BORROWED', 'BORROWING', 22, '{\"user\":\"STU9713\",\"copy\":\"97807195331713\"}', NULL, '2026-09-29 14:14:00'),
(796, NULL, 'BOOK_RETURNED', 'RETURN', 15, '{\"copy\":\"97807195331713\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 14:14:00'),
(798, NULL, 'BOOK_BORROWED', 'BORROWING', 23, '{\"user\":\"STU9713\",\"copy\":\"97802620338713\"}', NULL, '2026-09-29 14:14:00'),
(799, NULL, 'BOOK_RETURNED', 'RETURN', 16, '{\"copy\":\"97802620338713\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 14:14:00'),
(800, NULL, 'USER_LOGIN', 'USER', 65, 'Login successful', NULL, '2026-09-29 14:14:21'),
(802, NULL, 'BOOK_BORROWED', 'BORROWING', 24, '{\"user\":\"BPSTU91261340\",\"copy\":\"BOOK053-C1\"}', NULL, '2026-09-29 14:14:21'),
(803, NULL, 'BOOK_RETURNED', 'RETURN', 17, '{\"copy\":\"BOOK053-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 14:14:21'),
(804, NULL, 'USER_LOGIN', 'USER', 67, 'Login successful', NULL, '2026-09-29 14:14:22'),
(811, NULL, 'USER_LOGIN', 'USER', 68, 'Login successful', NULL, '2026-09-29 14:29:46'),
(812, NULL, 'USER_LOGIN', 'USER', 69, 'Login successful', NULL, '2026-09-29 14:29:46'),
(818, NULL, 'BOOK_BORROWED', 'BORROWING', 25, '{\"user\":\"STU5732\",\"copy\":\"97807195331732\"}', NULL, '2026-09-29 14:29:47'),
(819, NULL, 'BOOK_RETURNED', 'RETURN', 18, '{\"copy\":\"97807195331732\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 14:29:47'),
(821, NULL, 'BOOK_BORROWED', 'BORROWING', 26, '{\"user\":\"STU5732\",\"copy\":\"97802620338732\"}', NULL, '2026-09-29 14:29:47'),
(822, NULL, 'BOOK_RETURNED', 'RETURN', 19, '{\"copy\":\"97802620338732\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 14:29:47'),
(823, NULL, 'USER_LOGIN', 'USER', 70, 'Login successful', NULL, '2026-09-29 14:29:47'),
(825, NULL, 'BOOK_BORROWED', 'BORROWING', 27, '{\"user\":\"BPSTU92188081\",\"copy\":\"BOOK059-C1\"}', NULL, '2026-09-29 14:29:48'),
(826, NULL, 'BOOK_RETURNED', 'RETURN', 20, '{\"copy\":\"BOOK059-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 14:29:48'),
(827, NULL, 'USER_LOGIN', 'USER', 72, 'Login successful', NULL, '2026-09-29 14:29:48'),
(834, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-29 15:22:06'),
(835, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 15:32:38'),
(836, NULL, 'USER_LOGIN', 'USER', 73, 'Login successful', NULL, '2026-09-29 15:40:24'),
(837, NULL, 'USER_LOGIN', 'USER', 74, 'Login successful', NULL, '2026-09-29 15:40:24'),
(839, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 156, 'BOOK063-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-29 15:40:25'),
(840, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 156, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK063-C1', NULL, '2026-09-29 15:40:25'),
(843, NULL, 'BOOK_BORROWED', 'BORROWING', 28, '{\"user\":\"STU2494\",\"copy\":\"97807195331494\"}', NULL, '2026-09-29 15:40:25'),
(844, NULL, 'BOOK_RETURNED', 'RETURN', 21, '{\"copy\":\"97807195331494\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 15:40:25'),
(846, NULL, 'BOOK_BORROWED', 'BORROWING', 29, '{\"user\":\"STU2494\",\"copy\":\"97802620338494\"}', NULL, '2026-09-29 15:40:26'),
(847, NULL, 'BOOK_RETURNED', 'RETURN', 22, '{\"copy\":\"97802620338494\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 15:40:26'),
(848, NULL, 'USER_LOGIN', 'USER', 75, 'Login successful', NULL, '2026-09-29 15:40:59'),
(855, NULL, 'USER_LOGIN', 'USER', 76, 'Login successful', NULL, '2026-09-29 16:24:00'),
(862, NULL, 'USER_LOGIN', 'USER', 77, 'Login successful', NULL, '2026-09-29 16:24:17'),
(863, NULL, 'USER_LOGIN', 'USER', 78, 'Login successful', NULL, '2026-09-29 16:24:18'),
(865, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 164, 'BOOK071-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-29 16:24:18'),
(866, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 164, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK071-C1', NULL, '2026-09-29 16:24:18'),
(869, NULL, 'BOOK_BORROWED', 'BORROWING', 30, '{\"user\":\"STU7396\",\"copy\":\"97807195331396\"}', NULL, '2026-09-29 16:24:18'),
(870, NULL, 'BOOK_RETURNED', 'RETURN', 23, '{\"copy\":\"97807195331396\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 16:24:18'),
(872, NULL, 'BOOK_BORROWED', 'BORROWING', 31, '{\"user\":\"STU7396\",\"copy\":\"97802620338396\"}', NULL, '2026-09-29 16:24:18'),
(873, NULL, 'BOOK_RETURNED', 'RETURN', 24, '{\"copy\":\"97802620338396\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 16:24:18'),
(874, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-29 16:26:50'),
(875, 1, 'EBOOK_UPLOADED', 'EBOOK', 9, 'Maths S1 ', NULL, '2026-09-29 16:31:32'),
(876, NULL, 'USER_LOGIN', 'USER', 79, 'Login successful', NULL, '2026-09-29 16:42:19'),
(883, NULL, 'USER_LOGIN', 'USER', 80, 'Login successful', NULL, '2026-09-29 16:42:21'),
(884, NULL, 'USER_LOGIN', 'USER', 81, 'Login successful', NULL, '2026-09-29 16:42:21'),
(886, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 169, 'BOOK076-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-29 16:42:21'),
(887, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 169, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK076-C1', NULL, '2026-09-29 16:42:21'),
(890, NULL, 'BOOK_BORROWED', 'BORROWING', 32, '{\"user\":\"STU0596\",\"copy\":\"97807195331596\"}', NULL, '2026-09-29 16:42:21'),
(891, NULL, 'BOOK_RETURNED', 'RETURN', 25, '{\"copy\":\"97807195331596\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 16:42:22'),
(893, NULL, 'BOOK_BORROWED', 'BORROWING', 33, '{\"user\":\"STU0596\",\"copy\":\"97802620338596\"}', NULL, '2026-09-29 16:42:22'),
(894, NULL, 'BOOK_RETURNED', 'RETURN', 26, '{\"copy\":\"97802620338596\",\"fine\":0,\"condition\":null}', NULL, '2026-09-29 16:42:22'),
(895, 1, 'BOOK_ADDED', 'BOOK', 78, 'asdfghj, 1 copies', NULL, '2026-09-29 17:04:27'),
(896, NULL, 'BOOK_REQUESTED', 'BORROWING', 34, '{\"user\":\"STU0002\",\"copy\":\"HHMXCGALZM9\",\"pending\":true}', NULL, '2026-09-29 17:05:11'),
(897, 1, 'BOOK_BORROWED', 'BORROWING', 35, '{\"user\":\"STU0002\",\"copy\":\"HHMXCGALZM9\"}', NULL, '2026-09-29 17:05:57'),
(898, 1, 'BOOK_RETURNED', 'RETURN', 27, '{\"copy\":\"HHMXCGALZM9\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-09-29 17:07:17'),
(899, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-30 05:25:34'),
(900, 1, 'SUBJECT_DELETED', 'SUBJECT', 109, 'Biology (S1)', NULL, '2026-09-30 05:27:57'),
(901, 1, 'SUBJECT_DELETED', 'SUBJECT', 130, 'Chemistry (S1)', NULL, '2026-09-30 05:28:09'),
(902, 1, 'SUBJECT_DELETED', 'SUBJECT', 25, 'English (S1)', NULL, '2026-09-30 05:28:20'),
(903, 1, 'SUBJECT_DELETED', 'SUBJECT', 172, 'Entrepreneurships (S1)', NULL, '2026-09-30 05:28:25'),
(904, 1, 'SUBJECT_DELETED', 'SUBJECT', 46, 'French (S1)', NULL, '2026-09-30 05:28:32'),
(905, 1, 'SUBJECT_DELETED', 'SUBJECT', 277, 'General (S1)', NULL, '2026-09-30 05:28:35'),
(906, 1, 'SUBJECT_DELETED', 'SUBJECT', 214, 'Geography (S1)', NULL, '2026-09-30 05:28:38'),
(907, 1, 'SUBJECT_DELETED', 'SUBJECT', 193, 'History (S1)', NULL, '2026-09-30 05:28:41'),
(908, 1, 'SUBJECT_DELETED', 'SUBJECT', 151, 'ICT (S1)', NULL, '2026-09-30 05:28:45'),
(909, 1, 'SUBJECT_DELETED', 'SUBJECT', 4, 'Kinyarwanda (S1)', NULL, '2026-09-30 05:28:48'),
(910, 1, 'SUBJECT_DELETED', 'SUBJECT', 235, 'Literature (S1)', NULL, '2026-09-30 05:28:53'),
(911, 1, 'SUBJECT_DELETED', 'SUBJECT', 67, 'Maths (S1)', NULL, '2026-09-30 05:28:57'),
(912, 1, 'SUBJECT_DELETED', 'SUBJECT', 256, 'Religion (S1)', NULL, '2026-09-30 05:29:01'),
(913, 1, 'SUBJECT_DELETED', 'SUBJECT', 260, 'Religion (S2)', NULL, '2026-09-30 05:29:06'),
(914, 1, 'SUBJECT_DELETED', 'SUBJECT', 92, 'Physics (S2)', NULL, '2026-09-30 05:29:09'),
(915, 1, 'SUBJECT_DELETED', 'SUBJECT', 71, 'Maths (S2)', NULL, '2026-09-30 05:29:14'),
(916, 1, 'SUBJECT_DELETED', 'SUBJECT', 239, 'Literature (S2)', NULL, '2026-09-30 05:29:17'),
(917, 1, 'SUBJECT_DELETED', 'SUBJECT', 8, 'Kinyarwanda (S2)', NULL, '2026-09-30 05:29:22'),
(918, 1, 'SUBJECT_DELETED', 'SUBJECT', 155, 'ICT (S2)', NULL, '2026-09-30 05:29:25'),
(919, 1, 'SUBJECT_DELETED', 'SUBJECT', 197, 'History (S2)', NULL, '2026-09-30 05:29:29'),
(920, 1, 'SUBJECT_DELETED', 'SUBJECT', 218, 'Geography (S2)', NULL, '2026-09-30 05:29:36'),
(921, 1, 'SUBJECT_DELETED', 'SUBJECT', 281, 'General (S2)', NULL, '2026-09-30 05:29:40'),
(922, 1, 'SUBJECT_DELETED', 'SUBJECT', 50, 'French (S2)', NULL, '2026-09-30 05:29:43'),
(923, 1, 'SUBJECT_DELETED', 'SUBJECT', 176, 'Entrepreneurships (S2)', NULL, '2026-09-30 05:29:46'),
(924, 1, 'SUBJECT_DELETED', 'SUBJECT', 29, 'English (S2)', NULL, '2026-09-30 05:29:50'),
(925, 1, 'SUBJECT_DELETED', 'SUBJECT', 113, 'Biology (S2)', NULL, '2026-09-30 05:29:54'),
(926, 1, 'SUBJECT_DELETED', 'SUBJECT', 134, 'Chemistry (S2)', NULL, '2026-09-30 05:29:57'),
(927, 1, 'SUBJECT_DELETED', 'SUBJECT', 264, 'Religion (S3)', NULL, '2026-09-30 05:30:05'),
(928, 1, 'SUBJECT_DELETED', 'SUBJECT', 96, 'Physics (S3)', NULL, '2026-09-30 05:30:09'),
(929, 1, 'SUBJECT_DELETED', 'SUBJECT', 12, 'Kinyarwanda (S3)', NULL, '2026-09-30 05:30:14'),
(930, 1, 'SUBJECT_DELETED', 'SUBJECT', 75, 'Maths (S3)', NULL, '2026-09-30 05:30:22'),
(931, 1, 'SUBJECT_DELETED', 'SUBJECT', 243, 'Literature (S3)', NULL, '2026-09-30 05:30:26'),
(932, 1, 'SUBJECT_DELETED', 'SUBJECT', 159, 'ICT (S3)', NULL, '2026-09-30 05:30:30'),
(933, 1, 'SUBJECT_DELETED', 'SUBJECT', 201, 'History (S3)', NULL, '2026-09-30 05:30:34'),
(934, 1, 'SUBJECT_DELETED', 'SUBJECT', 222, 'Geography (S3)', NULL, '2026-09-30 05:30:38'),
(935, 1, 'SUBJECT_DELETED', 'SUBJECT', 285, 'General (S3)', NULL, '2026-09-30 05:30:41'),
(936, 1, 'SUBJECT_DELETED', 'SUBJECT', 54, 'French (S3)', NULL, '2026-09-30 05:30:45'),
(937, 1, 'SUBJECT_DELETED', 'SUBJECT', 180, 'Entrepreneurships (S3)', NULL, '2026-09-30 05:30:48'),
(938, 1, 'SUBJECT_DELETED', 'SUBJECT', 33, 'English (S3)', NULL, '2026-09-30 05:30:51'),
(939, 1, 'SUBJECT_DELETED', 'SUBJECT', 138, 'Chemistry (S3)', NULL, '2026-09-30 05:30:55'),
(940, 1, 'SUBJECT_DELETED', 'SUBJECT', 117, 'Biology (S3)', NULL, '2026-09-30 05:31:01'),
(941, 1, 'SUBJECT_DELETED', 'SUBJECT', 268, 'Religion (S4)', NULL, '2026-09-30 05:31:09'),
(942, 1, 'SUBJECT_DELETED', 'SUBJECT', 100, 'Physics (S4)', NULL, '2026-09-30 05:31:13'),
(943, 1, 'SUBJECT_DELETED', 'SUBJECT', 79, 'Maths (S4)', NULL, '2026-09-30 05:31:16'),
(944, 1, 'SUBJECT_DELETED', 'SUBJECT', 247, 'Literature (S4)', NULL, '2026-09-30 05:31:19'),
(945, 1, 'SUBJECT_DELETED', 'SUBJECT', 16, 'Kinyarwanda (S4)', NULL, '2026-09-30 05:31:22'),
(946, 1, 'SUBJECT_DELETED', 'SUBJECT', 163, 'ICT (S4)', NULL, '2026-09-30 05:31:25'),
(947, 1, 'SUBJECT_DELETED', 'SUBJECT', 205, 'History (S4)', NULL, '2026-09-30 05:31:28'),
(948, 1, 'SUBJECT_DELETED', 'SUBJECT', 226, 'Geography (S4)', NULL, '2026-09-30 05:31:32'),
(949, 1, 'SUBJECT_DELETED', 'SUBJECT', 289, 'General (S4)', NULL, '2026-09-30 05:31:37'),
(950, 1, 'SUBJECT_DELETED', 'SUBJECT', 58, 'French (S4)', NULL, '2026-09-30 05:31:40'),
(951, 1, 'SUBJECT_DELETED', 'SUBJECT', 184, 'Entrepreneurships (S4)', NULL, '2026-09-30 05:31:43'),
(952, 1, 'SUBJECT_DELETED', 'SUBJECT', 37, 'English (S4)', NULL, '2026-09-30 05:31:46'),
(953, 1, 'SUBJECT_DELETED', 'SUBJECT', 142, 'Chemistry (S4)', NULL, '2026-09-30 05:31:51'),
(954, 1, 'SUBJECT_DELETED', 'SUBJECT', 121, 'Biology (S4)', NULL, '2026-09-30 05:31:54'),
(955, 1, 'SUBJECT_DELETED', 'SUBJECT', 272, 'Religion (S5)', NULL, '2026-09-30 05:31:59'),
(956, 1, 'SUBJECT_DELETED', 'SUBJECT', 104, 'Physics (S5)', NULL, '2026-09-30 05:32:03'),
(957, 1, 'SUBJECT_DELETED', 'SUBJECT', 83, 'Maths (S5)', NULL, '2026-09-30 05:32:08'),
(958, 1, 'SUBJECT_DELETED', 'SUBJECT', 251, 'Literature (S5)', NULL, '2026-09-30 05:32:12'),
(959, 1, 'SUBJECT_DELETED', 'SUBJECT', 20, 'Kinyarwanda (S5)', NULL, '2026-09-30 05:32:17'),
(960, 1, 'SUBJECT_DELETED', 'SUBJECT', 167, 'ICT (S5)', NULL, '2026-09-30 05:32:20'),
(961, 1, 'SUBJECT_DELETED', 'SUBJECT', 209, 'History (S5)', NULL, '2026-09-30 05:32:26'),
(962, 1, 'SUBJECT_DELETED', 'SUBJECT', 230, 'Geography (S5)', NULL, '2026-09-30 05:32:30'),
(963, 1, 'SUBJECT_DELETED', 'SUBJECT', 293, 'General (S5)', NULL, '2026-09-30 05:32:34'),
(964, 1, 'SUBJECT_DELETED', 'SUBJECT', 62, 'French (S5)', NULL, '2026-09-30 05:32:37'),
(965, 1, 'SUBJECT_DELETED', 'SUBJECT', 188, 'Entrepreneurships (S5)', NULL, '2026-09-30 05:32:40'),
(966, 1, 'SUBJECT_DELETED', 'SUBJECT', 41, 'English (S5)', NULL, '2026-09-30 05:32:44'),
(967, 1, 'SUBJECT_DELETED', 'SUBJECT', 146, 'Chemistry (S5)', NULL, '2026-09-30 05:32:48'),
(968, 1, 'SUBJECT_DELETED', 'SUBJECT', 125, 'Biology (S5)', NULL, '2026-09-30 05:32:54'),
(969, 1, 'SUBJECT_DELETED', 'SUBJECT', 333, 'Religion (S6)', NULL, '2026-09-30 05:33:01'),
(970, 1, 'SUBJECT_DELETED', 'SUBJECT', 309, 'Physics (S6)', NULL, '2026-09-30 05:33:05'),
(971, 1, 'SUBJECT_DELETED', 'SUBJECT', 306, 'Maths (S6)', NULL, '2026-09-30 05:33:10'),
(972, 1, 'SUBJECT_DELETED', 'SUBJECT', 330, 'Literature (S6)', NULL, '2026-09-30 05:33:15'),
(973, 1, 'SUBJECT_DELETED', 'SUBJECT', 297, 'Kinyarwanda (S6)', NULL, '2026-09-30 05:33:19'),
(974, 1, 'SUBJECT_DELETED', 'SUBJECT', 318, 'ICT (S6)', NULL, '2026-09-30 05:33:23'),
(975, 1, 'SUBJECT_DELETED', 'SUBJECT', 324, 'History (S6)', NULL, '2026-09-30 05:33:26'),
(976, 1, 'SUBJECT_DELETED', 'SUBJECT', 327, 'Geography (S6)', NULL, '2026-09-30 05:33:30'),
(977, 1, 'SUBJECT_DELETED', 'SUBJECT', 336, 'General (S6)', NULL, '2026-09-30 05:33:41'),
(978, 1, 'SUBJECT_DELETED', 'SUBJECT', 303, 'French (S6)', NULL, '2026-09-30 05:33:44'),
(979, 1, 'SUBJECT_DELETED', 'SUBJECT', 321, 'Entrepreneurships (S6)', NULL, '2026-09-30 05:33:48'),
(980, 1, 'SUBJECT_DELETED', 'SUBJECT', 300, 'English (S6)', NULL, '2026-09-30 05:33:52'),
(981, 1, 'SUBJECT_DELETED', 'SUBJECT', 315, 'Chemistry (S6)', NULL, '2026-09-30 05:33:55'),
(982, 1, 'SUBJECT_DELETED', 'SUBJECT', 312, 'Biology (S6)', NULL, '2026-09-30 05:33:59'),
(983, 1, 'SUBJECT_DELETED', 'SUBJECT', 107, 'Biology (S1)', NULL, '2026-09-30 05:34:15'),
(984, 1, 'SUBJECT_DELETED', 'SUBJECT', 128, 'Chemistry (S1)', NULL, '2026-09-30 05:34:22'),
(985, 1, 'SUBJECT_DELETED', 'SUBJECT', 23, 'English (S1)', NULL, '2026-09-30 05:34:26'),
(986, 1, 'SUBJECT_DELETED', 'SUBJECT', 170, 'Entrepreneurships (S1)', NULL, '2026-09-30 05:34:28'),
(987, 1, 'SUBJECT_DELETED', 'SUBJECT', 44, 'French (S1)', NULL, '2026-09-30 05:34:31'),
(988, 1, 'SUBJECT_DELETED', 'SUBJECT', 275, 'General (S1)', NULL, '2026-09-30 05:34:39'),
(989, 1, 'SUBJECT_DELETED', 'SUBJECT', 212, 'Geography (S1)', NULL, '2026-09-30 05:34:42'),
(990, 1, 'SUBJECT_DELETED', 'SUBJECT', 191, 'History (S1)', NULL, '2026-09-30 05:34:47'),
(991, 1, 'SUBJECT_DELETED', 'SUBJECT', 149, 'ICT (S1)', NULL, '2026-09-30 05:34:50'),
(992, 1, 'SUBJECT_DELETED', 'SUBJECT', 2, 'Kinyarwanda (S1)', NULL, '2026-09-30 05:34:53'),
(993, 1, 'SUBJECT_DELETED', 'SUBJECT', 233, 'Literature (S1)', NULL, '2026-09-30 05:34:57'),
(994, 1, 'SUBJECT_DELETED', 'SUBJECT', 65, 'Maths (S1)', NULL, '2026-09-30 05:35:01'),
(995, 1, 'SUBJECT_DELETED', 'SUBJECT', 86, 'Physics (S1)', NULL, '2026-09-30 05:35:04'),
(996, 1, 'SUBJECT_DELETED', 'SUBJECT', 111, 'Biology (S2)', NULL, '2026-09-30 05:35:09'),
(997, 1, 'SUBJECT_DELETED', 'SUBJECT', 132, 'Chemistry (S2)', NULL, '2026-09-30 05:35:13'),
(998, 1, 'SUBJECT_DELETED', 'SUBJECT', 174, 'Entrepreneurships (S2)', NULL, '2026-09-30 05:35:16'),
(999, 1, 'SUBJECT_DELETED', 'SUBJECT', 27, 'English (S2)', NULL, '2026-09-30 05:35:19'),
(1000, 1, 'SUBJECT_DELETED', 'SUBJECT', 48, 'French (S2)', NULL, '2026-09-30 05:35:22'),
(1001, 1, 'SUBJECT_DELETED', 'SUBJECT', 279, 'General (S2)', NULL, '2026-09-30 05:35:29'),
(1002, 1, 'SUBJECT_DELETED', 'SUBJECT', 216, 'Geography (S2)', NULL, '2026-09-30 05:35:34'),
(1003, 1, 'SUBJECT_DELETED', 'SUBJECT', 195, 'History (S2)', NULL, '2026-09-30 05:35:37'),
(1004, 1, 'SUBJECT_DELETED', 'SUBJECT', 153, 'ICT (S2)', NULL, '2026-09-30 05:35:41'),
(1005, 1, 'SUBJECT_DELETED', 'SUBJECT', 6, 'Kinyarwanda (S2)', NULL, '2026-09-30 05:35:44'),
(1006, 1, 'SUBJECT_DELETED', 'SUBJECT', 237, 'Literature (S2)', NULL, '2026-09-30 05:35:49'),
(1007, 1, 'SUBJECT_DELETED', 'SUBJECT', 69, 'Maths (S2)', NULL, '2026-09-30 05:35:54'),
(1008, 1, 'SUBJECT_DELETED', 'SUBJECT', 90, 'Physics (S2)', NULL, '2026-09-30 05:36:00'),
(1009, 1, 'SUBJECT_DELETED', 'SUBJECT', 115, 'Biology (S3)', NULL, '2026-09-30 05:36:04'),
(1010, 1, 'SUBJECT_DELETED', 'SUBJECT', 136, 'Chemistry (S3)', NULL, '2026-09-30 05:36:07'),
(1011, 1, 'SUBJECT_DELETED', 'SUBJECT', 31, 'English (S3)', NULL, '2026-09-30 05:36:11'),
(1012, 1, 'SUBJECT_DELETED', 'SUBJECT', 178, 'Entrepreneurships (S3)', NULL, '2026-09-30 05:36:14'),
(1013, 1, 'SUBJECT_DELETED', 'SUBJECT', 52, 'French (S3)', NULL, '2026-09-30 05:36:17'),
(1014, 1, 'SUBJECT_DELETED', 'SUBJECT', 283, 'General (S3)', NULL, '2026-09-30 05:36:20'),
(1015, 1, 'SUBJECT_DELETED', 'SUBJECT', 220, 'Geography (S3)', NULL, '2026-09-30 05:36:23'),
(1016, 1, 'SUBJECT_DELETED', 'SUBJECT', 199, 'History (S3)', NULL, '2026-09-30 05:36:26'),
(1017, 1, 'SUBJECT_DELETED', 'SUBJECT', 157, 'ICT (S3)', NULL, '2026-09-30 05:36:30'),
(1018, 1, 'SUBJECT_DELETED', 'SUBJECT', 10, 'Kinyarwanda (S3)', NULL, '2026-09-30 05:36:34'),
(1019, 1, 'SUBJECT_DELETED', 'SUBJECT', 241, 'Literature (S3)', NULL, '2026-09-30 05:36:39'),
(1020, 1, 'SUBJECT_DELETED', 'SUBJECT', 73, 'Maths (S3)', NULL, '2026-09-30 05:36:46'),
(1021, 1, 'SUBJECT_DELETED', 'SUBJECT', 94, 'Physics (S3)', NULL, '2026-09-30 05:36:49'),
(1022, 1, 'SUBJECT_DELETED', 'SUBJECT', 119, 'Biology (S4)', NULL, '2026-09-30 05:36:54'),
(1023, 1, 'SUBJECT_DELETED', 'SUBJECT', 140, 'Chemistry (S4)', NULL, '2026-09-30 05:36:58'),
(1024, 1, 'SUBJECT_DELETED', 'SUBJECT', 35, 'English (S4)', NULL, '2026-09-30 05:37:02'),
(1025, 1, 'SUBJECT_DELETED', 'SUBJECT', 182, 'Entrepreneurships (S4)', NULL, '2026-09-30 05:37:06'),
(1026, 1, 'SUBJECT_DELETED', 'SUBJECT', 56, 'French (S4)', NULL, '2026-09-30 05:37:11'),
(1027, 1, 'SUBJECT_DELETED', 'SUBJECT', 287, 'General (S4)', NULL, '2026-09-30 05:37:14'),
(1028, 1, 'SUBJECT_DELETED', 'SUBJECT', 224, 'Geography (S4)', NULL, '2026-09-30 05:37:22'),
(1029, 1, 'SUBJECT_DELETED', 'SUBJECT', 203, 'History (S4)', NULL, '2026-09-30 05:37:25'),
(1030, 1, 'SUBJECT_DELETED', 'SUBJECT', 161, 'ICT (S4)', NULL, '2026-09-30 05:37:28'),
(1031, 1, 'SUBJECT_DELETED', 'SUBJECT', 14, 'Kinyarwanda (S4)', NULL, '2026-09-30 05:37:31'),
(1032, 1, 'SUBJECT_DELETED', 'SUBJECT', 245, 'Literature (S4)', NULL, '2026-09-30 05:37:34'),
(1033, 1, 'SUBJECT_DELETED', 'SUBJECT', 77, 'Maths (S4)', NULL, '2026-09-30 05:37:37'),
(1034, 1, 'SUBJECT_DELETED', 'SUBJECT', 98, 'Physics (S4)', NULL, '2026-09-30 05:37:41'),
(1035, 1, 'SUBJECT_DELETED', 'SUBJECT', 123, 'Biology (S5)', NULL, '2026-09-30 05:37:47'),
(1036, 1, 'SUBJECT_DELETED', 'SUBJECT', 144, 'Chemistry (S5)', NULL, '2026-09-30 05:37:51'),
(1037, 1, 'SUBJECT_DELETED', 'SUBJECT', 39, 'English (S5)', NULL, '2026-09-30 05:37:55'),
(1038, 1, 'SUBJECT_DELETED', 'SUBJECT', 186, 'Entrepreneurships (S5)', NULL, '2026-09-30 05:38:00'),
(1039, 1, 'SUBJECT_DELETED', 'SUBJECT', 60, 'French (S5)', NULL, '2026-09-30 05:38:03'),
(1040, 1, 'SUBJECT_DELETED', 'SUBJECT', 291, 'General (S5)', NULL, '2026-09-30 05:38:06'),
(1041, 1, 'SUBJECT_DELETED', 'SUBJECT', 228, 'Geography (S5)', NULL, '2026-09-30 05:38:08'),
(1042, 1, 'SUBJECT_DELETED', 'SUBJECT', 207, 'History (S5)', NULL, '2026-09-30 05:38:14'),
(1043, 1, 'SUBJECT_DELETED', 'SUBJECT', 165, 'ICT (S5)', NULL, '2026-09-30 05:38:17'),
(1044, 1, 'SUBJECT_DELETED', 'SUBJECT', 18, 'Kinyarwanda (S5)', NULL, '2026-09-30 05:38:20'),
(1045, 1, 'SUBJECT_DELETED', 'SUBJECT', 249, 'Literature (S5)', NULL, '2026-09-30 05:38:23'),
(1046, 1, 'SUBJECT_DELETED', 'SUBJECT', 81, 'Maths (S5)', NULL, '2026-09-30 05:38:26'),
(1047, 1, 'SUBJECT_DELETED', 'SUBJECT', 102, 'Physics (S5)', NULL, '2026-09-30 05:38:29'),
(1048, 1, 'SUBJECT_DELETED', 'SUBJECT', 127, 'Biology (S6)', NULL, '2026-09-30 05:38:33'),
(1049, 1, 'SUBJECT_DELETED', 'SUBJECT', 148, 'Chemistry (S6)', NULL, '2026-09-30 05:38:36'),
(1050, 1, 'SUBJECT_DELETED', 'SUBJECT', 43, 'English (S6)', NULL, '2026-09-30 05:38:40'),
(1051, 1, 'SUBJECT_DELETED', 'SUBJECT', 190, 'Entrepreneurships (S6)', NULL, '2026-09-30 05:38:43'),
(1052, 1, 'SUBJECT_DELETED', 'SUBJECT', 64, 'French (S6)', NULL, '2026-09-30 05:38:47'),
(1053, 1, 'SUBJECT_DELETED', 'SUBJECT', 295, 'General (S6)', NULL, '2026-09-30 05:38:51'),
(1054, 1, 'SUBJECT_DELETED', 'SUBJECT', 232, 'Geography (S6)', NULL, '2026-09-30 05:38:54'),
(1055, 1, 'SUBJECT_DELETED', 'SUBJECT', 211, 'History (S6)', NULL, '2026-09-30 05:38:59'),
(1056, 1, 'SUBJECT_DELETED', 'SUBJECT', 169, 'ICT (S6)', NULL, '2026-09-30 05:39:03'),
(1057, 1, 'SUBJECT_DELETED', 'SUBJECT', 22, 'Kinyarwanda (S6)', NULL, '2026-09-30 05:39:07'),
(1058, 1, 'SUBJECT_DELETED', 'SUBJECT', 253, 'Literature (S6)', NULL, '2026-09-30 05:39:10'),
(1059, 1, 'SUBJECT_DELETED', 'SUBJECT', 85, 'Maths (S6)', NULL, '2026-09-30 05:39:13'),
(1060, 1, 'SUBJECT_DELETED', 'SUBJECT', 106, 'Physics (S6)', NULL, '2026-09-30 05:39:18'),
(1061, NULL, 'USER_LOGIN', 'USER', 82, 'Login successful', NULL, '2026-09-30 06:02:05'),
(1062, NULL, 'USER_LOGIN', 'USER', 83, 'Login successful', NULL, '2026-09-30 06:02:05'),
(1064, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 172, 'BOOK079-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 06:02:06'),
(1065, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 172, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK079-C1', NULL, '2026-09-30 06:02:06'),
(1068, NULL, 'BOOK_BORROWED', 'BORROWING', 36, '{\"user\":\"STU3668\",\"copy\":\"97807195331668\"}', NULL, '2026-09-30 06:02:06'),
(1069, NULL, 'BOOK_RETURNED', 'RETURN', 28, '{\"copy\":\"97807195331668\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 06:02:06'),
(1071, NULL, 'BOOK_BORROWED', 'BORROWING', 37, '{\"user\":\"STU3668\",\"copy\":\"97802620338668\"}', NULL, '2026-09-30 06:02:06'),
(1072, NULL, 'BOOK_RETURNED', 'RETURN', 29, '{\"copy\":\"97802620338668\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 06:02:06'),
(1073, NULL, 'USER_LOGIN', 'USER', 84, 'Login successful', NULL, '2026-09-30 06:02:07'),
(1080, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-30 06:57:07'),
(1081, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-30 06:57:44'),
(1082, 1, 'BOOK_ADDED', 'BOOK', 84, 'ASDFGHJKL, 1 copies', NULL, '2026-09-30 07:01:51'),
(1083, NULL, 'USER_LOGIN', 'USER', 85, 'Login successful', NULL, '2026-09-30 07:12:32'),
(1084, NULL, 'USER_LOGIN', 'USER', 86, 'Login successful', NULL, '2026-09-30 07:12:32'),
(1086, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 178, 'BOOK085-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 07:12:32'),
(1087, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 178, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK085-C1', NULL, '2026-09-30 07:12:32'),
(1090, NULL, 'BOOK_BORROWED', 'BORROWING', 38, '{\"user\":\"STU1226\",\"copy\":\"97807195331226\"}', NULL, '2026-09-30 07:12:32'),
(1091, NULL, 'BOOK_RETURNED', 'RETURN', 30, '{\"copy\":\"97807195331226\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 07:12:32'),
(1093, NULL, 'BOOK_BORROWED', 'BORROWING', 39, '{\"user\":\"STU1226\",\"copy\":\"97802620338226\"}', NULL, '2026-09-30 07:12:33'),
(1094, NULL, 'BOOK_RETURNED', 'RETURN', 31, '{\"copy\":\"97802620338226\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 07:12:33'),
(1095, NULL, 'USER_LOGIN', 'USER', 87, 'Login successful', NULL, '2026-09-30 07:12:33'),
(1102, NULL, 'USER_LOGIN_QR', 'USER', 32, 'Logged in via QR code', NULL, '2026-09-30 07:16:15'),
(1103, NULL, 'BOOK_REQUESTED', 'BORROWING', 40, '{\"user\":\"STU0002\",\"copy\":\"HHMXCGALZM9\",\"pending\":true}', NULL, '2026-09-30 07:16:41'),
(1104, 1, 'BORROW_REJECTED', 'BORROWING', 34, '{\"user\":\"STU0002\",\"copy\":\"HHMXCGALZM9\"}', NULL, '2026-09-30 07:30:08'),
(1105, 1, 'BORROW_REJECTED', 'BORROWING', 40, '{\"user\":\"STU0002\",\"copy\":\"HHMXCGALZM9\"}', NULL, '2026-09-30 07:30:11'),
(1106, NULL, 'BOOK_REQUESTED', 'BORROWING', 41, '{\"user\":\"STU0002\",\"copy\":\"B:B\",\"pending\":true}', NULL, '2026-09-30 07:30:44'),
(1107, NULL, 'USER_LOGIN', 'USER', 88, 'Login successful', NULL, '2026-09-30 07:32:25'),
(1108, NULL, 'USER_LOGIN', 'USER', 89, 'Login successful', NULL, '2026-09-30 07:32:26'),
(1110, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 183, 'BOOK090-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 07:32:26'),
(1111, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 183, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK090-C1', NULL, '2026-09-30 07:32:26'),
(1114, NULL, 'BOOK_BORROWED', 'BORROWING', 42, '{\"user\":\"STU5631\",\"copy\":\"97807195331631\"}', NULL, '2026-09-30 07:32:26'),
(1115, NULL, 'BOOK_RETURNED', 'RETURN', 32, '{\"copy\":\"97807195331631\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 07:32:26'),
(1117, NULL, 'BOOK_BORROWED', 'BORROWING', 43, '{\"user\":\"STU5631\",\"copy\":\"97802620338631\"}', NULL, '2026-09-30 07:32:26'),
(1118, NULL, 'BOOK_RETURNED', 'RETURN', 33, '{\"copy\":\"97802620338631\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 07:32:26'),
(1119, NULL, 'USER_LOGIN', 'USER', 90, 'Login successful', NULL, '2026-09-30 07:32:27'),
(1126, NULL, 'USER_LOGIN', 'USER', 91, 'Login successful', NULL, '2026-09-30 07:34:38'),
(1127, NULL, 'USER_LOGIN', 'USER', 92, 'Login successful', NULL, '2026-09-30 07:34:38'),
(1129, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 188, 'BOOK095-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 07:34:38'),
(1130, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 188, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK095-C1', NULL, '2026-09-30 07:34:38'),
(1133, NULL, 'BOOK_BORROWED', 'BORROWING', 44, '{\"user\":\"STU7775\",\"copy\":\"97807195331775\"}', NULL, '2026-09-30 07:34:39'),
(1134, NULL, 'BOOK_RETURNED', 'RETURN', 34, '{\"copy\":\"97807195331775\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 07:34:39'),
(1136, NULL, 'BOOK_BORROWED', 'BORROWING', 45, '{\"user\":\"STU7775\",\"copy\":\"97802620338775\"}', NULL, '2026-09-30 07:34:39'),
(1137, NULL, 'BOOK_RETURNED', 'RETURN', 35, '{\"copy\":\"97802620338775\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 07:34:39'),
(1138, NULL, 'USER_LOGIN', 'USER', 93, 'Login successful', NULL, '2026-09-30 07:34:40'),
(1145, 1, 'BORROW_REJECTED', 'BORROWING', 41, '{\"user\":\"STU0002\",\"copy\":\"B:B\"}', NULL, '2026-09-30 07:35:51'),
(1146, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-30 08:49:35'),
(1147, 1, 'CATEGORY_ADDED', 'CATEGORY', 10, 'ERTYUIOPDFGHJK', NULL, '2026-09-30 09:36:32'),
(1148, 1, 'SUBJECT_ADDED', 'SUBJECT', 10, 'sadfghjkl; (S1) - ERTYUIOPDFGHJK', NULL, '2026-09-30 09:36:57'),
(1149, 1, 'SUBJECT_DELETED', 'SUBJECT', 514, 'sadfghjkl; (S1)', NULL, '2026-09-30 09:37:07'),
(1150, 1, 'CATEGORY_DELETED', 'CATEGORY', 10, 'ERTYUIOPDFGHJK', NULL, '2026-09-30 09:37:13'),
(1151, NULL, 'USER_LOGIN', 'USER', 94, 'Login successful', NULL, '2026-09-30 10:49:41'),
(1152, NULL, 'USER_LOGIN', 'USER', 95, 'Login successful', NULL, '2026-09-30 10:49:42'),
(1154, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 193, 'BOOK100-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 10:49:42'),
(1155, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 193, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK100-C1', NULL, '2026-09-30 10:49:42'),
(1158, NULL, 'BOOK_BORROWED', 'BORROWING', 46, '{\"user\":\"STU0357\",\"copy\":\"97807195331357\"}', NULL, '2026-09-30 10:49:42'),
(1159, NULL, 'BOOK_RETURNED', 'RETURN', 36, '{\"copy\":\"97807195331357\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 10:49:42'),
(1161, NULL, 'BOOK_BORROWED', 'BORROWING', 47, '{\"user\":\"STU0357\",\"copy\":\"97802620338357\"}', NULL, '2026-09-30 10:49:42'),
(1162, NULL, 'BOOK_RETURNED', 'RETURN', 37, '{\"copy\":\"97802620338357\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 10:49:42'),
(1163, NULL, 'USER_LOGIN', 'USER', 96, 'Login successful', NULL, '2026-09-30 10:49:44'),
(1170, NULL, 'USER_LOGIN', 'USER', 98, 'Login successful', NULL, '2026-09-30 11:08:36'),
(1172, NULL, 'USER_LOGIN', 'USER', 99, 'Login successful', NULL, '2026-09-30 11:09:15'),
(1175, NULL, 'USER_LOGIN', 'USER', 100, 'Login successful', NULL, '2026-09-30 11:10:45'),
(1177, NULL, 'USER_LOGIN', 'USER', 101, 'Login successful', NULL, '2026-09-30 11:13:39'),
(1181, NULL, 'USER_LOGIN', 'USER', 102, 'Login successful', NULL, '2026-09-30 11:18:26'),
(1185, NULL, 'USER_LOGIN', 'USER', 103, 'Login successful', NULL, '2026-09-30 11:19:28'),
(1186, NULL, 'USER_LOGIN', 'USER', 104, 'Login successful', NULL, '2026-09-30 11:19:28'),
(1188, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 205, 'BOOK112-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 11:19:28'),
(1189, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 205, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK112-C1', NULL, '2026-09-30 11:19:28'),
(1192, NULL, 'BOOK_BORROWED', 'BORROWING', 51, '{\"user\":\"STU8399\",\"copy\":\"97807195331399\"}', NULL, '2026-09-30 11:19:29'),
(1193, NULL, 'BOOK_RETURNED', 'RETURN', 38, '{\"copy\":\"97807195331399\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 11:19:29'),
(1195, NULL, 'BOOK_BORROWED', 'BORROWING', 52, '{\"user\":\"STU8399\",\"copy\":\"97802620338399\"}', NULL, '2026-09-30 11:19:29'),
(1196, NULL, 'BOOK_RETURNED', 'RETURN', 39, '{\"copy\":\"97802620338399\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 11:19:29'),
(1197, NULL, 'USER_LOGIN', 'USER', 105, 'Login successful', NULL, '2026-09-30 11:19:29'),
(1204, 1, 'BOOK_DELETED', 'BOOK', 78, 'asdfghj - 1 copy deleted', NULL, '2026-09-30 11:29:38'),
(1205, 1, 'BOOK_DELETED', 'BOOK', 84, 'ASDFGHJKL - 1 copy deleted', NULL, '2026-09-30 11:29:42'),
(1206, NULL, 'USER_LOGIN', 'USER', 106, 'Login successful', NULL, '2026-09-30 12:19:27'),
(1207, NULL, 'USER_LOGIN', 'USER', 107, 'Login successful', NULL, '2026-09-30 12:19:27'),
(1209, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 210, 'BOOK117-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 12:19:27'),
(1210, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 210, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK117-C1', NULL, '2026-09-30 12:19:27'),
(1213, NULL, 'BOOK_BORROWED', 'BORROWING', 53, '{\"user\":\"STU6776\",\"copy\":\"97807195331776\"}', NULL, '2026-09-30 12:19:27'),
(1214, NULL, 'BOOK_RETURNED', 'RETURN', 40, '{\"copy\":\"97807195331776\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 12:19:27'),
(1216, NULL, 'BOOK_BORROWED', 'BORROWING', 54, '{\"user\":\"STU6776\",\"copy\":\"97802620338776\"}', NULL, '2026-09-30 12:19:27'),
(1217, NULL, 'BOOK_RETURNED', 'RETURN', 41, '{\"copy\":\"97802620338776\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 12:19:27'),
(1218, NULL, 'USER_LOGIN', 'USER', 108, 'Login successful', NULL, '2026-09-30 12:19:29'),
(1225, NULL, 'USER_LOGIN', 'USER', 109, 'Login successful', NULL, '2026-09-30 12:38:10'),
(1226, NULL, 'USER_LOGIN', 'USER', 110, 'Login successful', NULL, '2026-09-30 12:38:11'),
(1228, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 215, 'BOOK122-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 12:38:11'),
(1229, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 215, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK122-C1', NULL, '2026-09-30 12:38:11'),
(1232, NULL, 'BOOK_BORROWED', 'BORROWING', 55, '{\"user\":\"STU0270\",\"copy\":\"97807195331270\"}', NULL, '2026-09-30 12:38:11'),
(1233, NULL, 'BOOK_RETURNED', 'RETURN', 42, '{\"copy\":\"97807195331270\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 12:38:11'),
(1235, NULL, 'BOOK_BORROWED', 'BORROWING', 56, '{\"user\":\"STU0270\",\"copy\":\"97802620338270\"}', NULL, '2026-09-30 12:38:11'),
(1236, NULL, 'BOOK_RETURNED', 'RETURN', 43, '{\"copy\":\"97802620338270\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 12:38:11'),
(1237, NULL, 'USER_LOGIN', 'USER', 111, 'Login successful', NULL, '2026-09-30 12:38:13'),
(1244, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-30 12:39:59'),
(1245, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-30 12:45:03'),
(1246, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-09-30 12:49:48'),
(1247, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-09-30 12:59:20'),
(1248, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-30 13:01:08'),
(1249, 1, 'BOOK_ADDED', 'BOOK', 127, 'ewrtyuiklo, 1 copies', NULL, '2026-09-30 13:04:27'),
(1250, 1, 'BOOK_DELETED', 'BOOK', 127, 'ewrtyuiklo - 1 copy deleted', NULL, '2026-09-30 13:04:36'),
(1251, 31, 'BOOK_BORROWED', 'BORROWING', 57, '{\"user\":\"TCH0001\",\"copy\":\"EBK008-D1\"}', NULL, '2026-09-30 13:05:53'),
(1252, 31, 'EBOOK_DOWNLOADED', 'EBOOK', 8, 'Biology S1', NULL, '2026-09-30 13:05:53'),
(1253, 31, 'BOOK_RETURNED', 'RETURN', 44, '{\"copy\":\"EBK008-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-30 13:07:05'),
(1257, NULL, 'USER_LOGIN', 'USER', 114, 'Login successful', NULL, '2026-09-30 13:33:10'),
(1258, NULL, 'USER_LOGIN', 'USER', 115, 'Login successful', NULL, '2026-09-30 13:33:10'),
(1260, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 222, 'BOOK129-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 13:33:11'),
(1261, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 222, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK129-C1', NULL, '2026-09-30 13:33:11'),
(1264, NULL, 'BOOK_BORROWED', 'BORROWING', 59, '{\"user\":\"STU0078\",\"copy\":\"97807195331078\"}', NULL, '2026-09-30 13:33:11'),
(1265, NULL, 'BOOK_RETURNED', 'RETURN', 45, '{\"copy\":\"97807195331078\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 13:33:11'),
(1267, NULL, 'BOOK_BORROWED', 'BORROWING', 60, '{\"user\":\"STU0078\",\"copy\":\"97802620338078\"}', NULL, '2026-09-30 13:33:11'),
(1268, NULL, 'BOOK_RETURNED', 'RETURN', 46, '{\"copy\":\"97802620338078\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 13:33:11'),
(1269, 31, 'BOOK_BORROWED', 'BORROWING', 61, '{\"user\":\"TCH0001\",\"copy\":\"EBK008-D1\"}', NULL, '2026-09-30 13:34:48'),
(1270, 31, 'EBOOK_DOWNLOADED', 'EBOOK', 8, 'Biology S1', NULL, '2026-09-30 13:34:48'),
(1271, 31, 'BOOK_RETURNED', 'RETURN', 47, '{\"copy\":\"EBK008-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-30 13:35:50'),
(1272, 1, 'USER_UPDATED', 'USER', 30, '{\"first_name\":\"mugabo\",\"last_name\":\"patrick\",\"email\":\"mugabo.patrick1312@hopehavenschool.org\",\"phone\":\"0788888888\",\"role\":\"STUDENT\",\"status\":\"ACTIVE\",\"class_name\":\"S1\",\"physical_card_no\":\"\"}', NULL, '2026-09-30 13:39:29'),
(1273, 1, 'USER_UPDATED', 'USER', 31, '{\"first_name\":\"Ezras\",\"last_name\":\"MITWERI\",\"email\":\"ezras.mitweri1312@hopehavenschool.org\",\"phone\":\"0799999999\",\"role\":\"TEACHER\",\"status\":\"ACTIVE\",\"class_name\":\"\",\"physical_card_no\":\"\"}', NULL, '2026-09-30 13:39:57'),
(1274, 1, 'USER_UPDATED', 'USER', 30, '{\"first_name\":\"mugabo\",\"last_name\":\"patrick\",\"email\":\"mugabo.patrick1312@hopehavenschool.org\",\"phone\":\"0788888888\",\"role\":\"STUDENT\",\"status\":\"ACTIVE\",\"class_name\":\"S1\",\"physical_card_no\":\"\"}', NULL, '2026-09-30 13:40:04'),
(1275, 1, 'USER_UPDATED', 'USER', 1, '{\"first_name\":\"System\",\"last_name\":\"Administrator\",\"email\":\"librarian@hopehavenschool.org\",\"phone\":\"0788000000\",\"role\":\"LIBRARIAN\",\"status\":\"ACTIVE\",\"class_name\":\"\",\"physical_card_no\":\"10292358\"}', NULL, '2026-09-30 13:40:20'),
(1276, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'READ_BORROW', NULL, '2026-09-30 13:40:50'),
(1277, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'READ_ONLY', NULL, '2026-09-30 13:41:30'),
(1278, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'READ_BORROW', NULL, '2026-09-30 13:41:44'),
(1279, 1, 'BOOK_ADDED', 'BOOK', 131, 'guide to dessection, 1 copies', NULL, '2026-09-30 13:47:42'),
(1280, 1, 'EBOOK_ACCESS_MODE', 'EBOOK', 8, 'READ_ONLY', NULL, '2026-09-30 13:55:25'),
(1296, NULL, 'USER_LOGIN', 'USER', 122, 'Login successful', NULL, '2026-09-30 14:03:36'),
(1297, NULL, 'USER_LOGIN', 'USER', 123, 'Login successful', NULL, '2026-09-30 14:03:36'),
(1299, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 225, 'BOOK132-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 14:03:36'),
(1300, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 225, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK132-C1', NULL, '2026-09-30 14:03:36'),
(1303, NULL, 'BOOK_BORROWED', 'BORROWING', 67, '{\"user\":\"STU5902\",\"copy\":\"97807195331902\"}', NULL, '2026-09-30 14:03:37'),
(1304, NULL, 'BOOK_RETURNED', 'RETURN', 48, '{\"copy\":\"97807195331902\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 14:03:37'),
(1306, NULL, 'BOOK_BORROWED', 'BORROWING', 68, '{\"user\":\"STU5902\",\"copy\":\"97802620338902\"}', NULL, '2026-09-30 14:03:37'),
(1307, NULL, 'BOOK_RETURNED', 'RETURN', 49, '{\"copy\":\"97802620338902\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 14:03:37'),
(1353, NULL, 'USER_LOGIN', 'USER', 137, 'Login successful', NULL, '2026-09-30 15:07:32'),
(1354, NULL, 'USER_LOGIN', 'USER', 138, 'Login successful', NULL, '2026-09-30 15:07:32'),
(1356, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 239, 'BOOK134-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-09-30 15:07:32'),
(1357, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 239, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK134-C1', NULL, '2026-09-30 15:07:32'),
(1360, NULL, 'BOOK_BORROWED', 'BORROWING', 83, '{\"user\":\"STU2133\",\"copy\":\"97807195331133\"}', NULL, '2026-09-30 15:07:32'),
(1361, NULL, 'BOOK_RETURNED', 'RETURN', 61, '{\"copy\":\"97807195331133\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 15:07:33'),
(1363, NULL, 'BOOK_BORROWED', 'BORROWING', 84, '{\"user\":\"STU2133\",\"copy\":\"97802620338133\"}', NULL, '2026-09-30 15:07:33'),
(1364, NULL, 'BOOK_RETURNED', 'RETURN', 62, '{\"copy\":\"97802620338133\",\"fine\":0,\"condition\":null}', NULL, '2026-09-30 15:07:33'),
(1365, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-10-01 05:08:21'),
(1366, 30, 'USER_LOGIN_QR', 'USER', 30, 'Logged in via QR code', NULL, '2026-10-01 05:08:33'),
(1367, 31, 'USER_LOGIN_QR', 'USER', 31, 'Logged in via QR code', NULL, '2026-10-01 05:08:42'),
(1368, 30, 'BOOK_REQUESTED', 'BORROWING', 85, '{\"user\":\"STU0001\",\"copy\":\"HHO5OIYZW55\",\"pending\":true}', NULL, '2026-10-01 05:10:27'),
(1369, 1, 'BOOK_ADDED', 'BOOK', 136, 'cfghjkl;\'l, 1 copies', NULL, '2026-10-01 05:12:25'),
(1370, 30, 'BOOK_REQUESTED', 'BORROWING', 86, '{\"user\":\"STU0001\",\"copy\":\"HHO5OIYZW5S\",\"pending\":true}', NULL, '2026-10-01 05:13:24'),
(1371, 1, 'BOOK_BORROWED', 'BORROWING', 87, '{\"user\":\"STU0001\",\"copy\":\"HHO5OIYZW5S\"}', NULL, '2026-10-01 05:14:03'),
(1372, 1, 'BORROW_APPROVED', 'BORROWING', 85, '{\"user\":\"STU0001\",\"copy\":\"HHO5OIYZW55\"}', NULL, '2026-10-01 05:14:26'),
(1373, 30, 'BOOK_RETURNED', 'RETURN', 63, '{\"copy\":\"HHO5OIYZW55\",\"fine\":0,\"self_service\":true}', NULL, '2026-10-01 05:15:21'),
(1374, 1, 'BOOK_RETURNED', 'RETURN', 64, '{\"copy\":\"HHO5OIYZW5S\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 05:16:30'),
(1384, NULL, 'USER_LOGIN', 'USER', 144, 'Login successful', NULL, '2026-10-01 05:51:42'),
(1385, NULL, 'USER_LOGIN', 'USER', 145, 'Login successful', NULL, '2026-10-01 05:51:42'),
(1386, NULL, 'BOOK_BORROWED', 'BORROWING', 91, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 05:51:42'),
(1387, NULL, 'BOOK_RETURNED', 'RETURN', 67, '{\"copy\":\"ZZDESK-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-10-01 05:51:42'),
(1388, NULL, 'BOOK_BORROWED', 'BORROWING', 92, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 05:51:42'),
(1389, NULL, 'BOOK_BORROWED', 'BORROWING', 93, '{\"user\":\"STUZZDESK\",\"copy\":\"EBKZZDESK-D2\"}', NULL, '2026-10-01 05:51:42'),
(1390, NULL, 'BOOK_RETURNED', 'RETURN', 68, '{\"copy\":\"EBKZZDESK-D2\",\"fine\":0,\"self_service\":true}', NULL, '2026-10-01 05:51:42'),
(1404, NULL, 'USER_LOGIN', 'USER', 148, 'Login successful', NULL, '2026-10-01 05:52:09'),
(1405, NULL, 'USER_LOGIN', 'USER', 149, 'Login successful', NULL, '2026-10-01 05:52:09'),
(1407, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 252, 'BOOK137-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-10-01 05:52:09'),
(1408, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 252, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK137-C1', NULL, '2026-10-01 05:52:09'),
(1411, NULL, 'BOOK_BORROWED', 'BORROWING', 98, '{\"user\":\"STU8215\",\"copy\":\"97807195331215\"}', NULL, '2026-10-01 05:52:09'),
(1412, NULL, 'BOOK_RETURNED', 'RETURN', 73, '{\"copy\":\"97807195331215\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 05:52:10'),
(1414, NULL, 'BOOK_BORROWED', 'BORROWING', 99, '{\"user\":\"STU8215\",\"copy\":\"97802620338215\"}', NULL, '2026-10-01 05:52:10'),
(1415, NULL, 'BOOK_RETURNED', 'RETURN', 74, '{\"copy\":\"97802620338215\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 05:52:10'),
(1416, 31, 'BOOK_REQUESTED', 'BORROWING', 100, '{\"user\":\"TCH0001\",\"copy\":\"HHO5OIYZW5S\",\"pending\":true}', NULL, '2026-10-01 06:40:36'),
(1417, 1, 'BOOK_BORROWED', 'BORROWING', 101, '{\"user\":\"TCH0001\",\"copy\":\"HHO5OIYZW5S\"}', NULL, '2026-10-01 06:41:06'),
(1418, 1, 'BOOK_RETURNED', 'RETURN', 75, '{\"copy\":\"HHO5OIYZW5S\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 06:42:29'),
(1419, 1, 'BORROW_APPROVED', 'BORROWING', 100, '{\"user\":\"TCH0001\",\"copy\":\"HHO5OIYZW5S\"}', NULL, '2026-10-01 06:42:59'),
(1420, 1, 'BOOK_RETURNED', 'RETURN', 76, '{\"copy\":\"HHO5OIYZW5S\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 06:43:44'),
(1421, NULL, 'USER_LOGIN', 'USER', 150, 'Login successful', NULL, '2026-10-01 07:04:46'),
(1422, NULL, 'BOOK_ADDED', 'BOOK', 139, 'Anatomy Of Dissent, 3 copies', NULL, '2026-10-01 07:04:46'),
(1423, NULL, 'USER_LOGIN', 'USER', 151, 'Login successful', NULL, '2026-10-01 07:09:00'),
(1424, NULL, 'BOOK_ADDED', 'BOOK', 140, 'Anatomy Of Dissent, 3 copies', NULL, '2026-10-01 07:09:00'),
(1425, NULL, 'USER_LOGIN', 'USER', 152, 'Login successful', NULL, '2026-10-01 07:15:57'),
(1426, NULL, 'USER_LOGIN', 'USER', 153, 'Login successful', NULL, '2026-10-01 07:15:57'),
(1428, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 260, 'BOOK141-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-10-01 07:15:57'),
(1429, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 260, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK141-C1', NULL, '2026-10-01 07:15:57'),
(1432, NULL, 'BOOK_BORROWED', 'BORROWING', 102, '{\"user\":\"STU5115\",\"copy\":\"97807195331115\"}', NULL, '2026-10-01 07:15:58'),
(1433, NULL, 'BOOK_RETURNED', 'RETURN', 77, '{\"copy\":\"97807195331115\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 07:15:58'),
(1435, NULL, 'BOOK_BORROWED', 'BORROWING', 103, '{\"user\":\"STU5115\",\"copy\":\"97802620338115\"}', NULL, '2026-10-01 07:15:58'),
(1436, NULL, 'BOOK_RETURNED', 'RETURN', 78, '{\"copy\":\"97802620338115\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 07:15:58'),
(1437, NULL, 'USER_LOGIN', 'USER', 154, 'Login successful', NULL, '2026-10-01 07:16:24'),
(1438, NULL, 'USER_LOGIN', 'USER', 155, 'Login successful', NULL, '2026-10-01 07:16:25'),
(1439, NULL, 'BOOK_BORROWED', 'BORROWING', 104, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 07:16:25'),
(1440, NULL, 'BOOK_RETURNED', 'RETURN', 79, '{\"copy\":\"ZZDESK-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-10-01 07:16:25'),
(1441, NULL, 'BOOK_BORROWED', 'BORROWING', 105, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 07:16:25'),
(1442, NULL, 'BOOK_BORROWED', 'BORROWING', 106, '{\"user\":\"STUZZDESK\",\"copy\":\"EBKZZDESK-D2\"}', NULL, '2026-10-01 07:16:25'),
(1443, NULL, 'BOOK_RETURNED', 'RETURN', 80, '{\"copy\":\"EBKZZDESK-D2\",\"fine\":0,\"self_service\":true}', NULL, '2026-10-01 07:16:25'),
(1457, NULL, 'USER_LOGIN', 'USER', 158, 'Login successful', NULL, '2026-10-01 07:31:32'),
(1458, NULL, 'USER_CREATED', 'USER', 159, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 07:31:33'),
(1459, NULL, 'USER_LOGIN', 'USER', 159, 'Login successful', NULL, '2026-10-01 07:31:33'),
(1460, NULL, 'USER_LOGIN', 'USER', 160, 'Login successful', NULL, '2026-10-01 07:33:12'),
(1461, NULL, 'USER_LOGIN', 'USER', 161, 'Login successful', NULL, '2026-10-01 07:33:12'),
(1463, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 268, 'BOOK143-C1 -> YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', NULL, '2026-10-01 07:33:12'),
(1464, NULL, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', 268, 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY -> BOOK143-C1', NULL, '2026-10-01 07:33:12'),
(1467, NULL, 'BOOK_BORROWED', 'BORROWING', 111, '{\"user\":\"STU1113\",\"copy\":\"97807195331113\"}', NULL, '2026-10-01 07:33:13'),
(1468, NULL, 'BOOK_RETURNED', 'RETURN', 85, '{\"copy\":\"97807195331113\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 07:33:13'),
(1470, NULL, 'BOOK_BORROWED', 'BORROWING', 112, '{\"user\":\"STU1113\",\"copy\":\"97802620338113\"}', NULL, '2026-10-01 07:33:13'),
(1471, NULL, 'BOOK_RETURNED', 'RETURN', 86, '{\"copy\":\"97802620338113\",\"fine\":0,\"condition\":null}', NULL, '2026-10-01 07:33:13'),
(1478, NULL, 'USER_LOGIN', 'USER', 164, 'Login successful', NULL, '2026-10-01 07:33:17'),
(1479, NULL, 'USER_LOGIN', 'USER', 165, 'Login successful', NULL, '2026-10-01 07:33:17'),
(1480, NULL, 'BOOK_BORROWED', 'BORROWING', 115, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 07:33:17'),
(1481, NULL, 'BOOK_RETURNED', 'RETURN', 87, '{\"copy\":\"ZZDESK-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-10-01 07:33:17'),
(1482, NULL, 'BOOK_BORROWED', 'BORROWING', 116, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 07:33:17'),
(1483, NULL, 'BOOK_BORROWED', 'BORROWING', 117, '{\"user\":\"STUZZDESK\",\"copy\":\"EBKZZDESK-D2\"}', NULL, '2026-10-01 07:33:17'),
(1484, NULL, 'BOOK_RETURNED', 'RETURN', 88, '{\"copy\":\"EBKZZDESK-D2\",\"fine\":0,\"self_service\":true}', NULL, '2026-10-01 07:33:17'),
(1487, NULL, 'USER_LOGIN', 'USER', 169, 'Login successful', NULL, '2026-10-01 08:06:22'),
(1488, NULL, 'USER_CREATED', 'USER', 170, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 08:06:22'),
(1489, NULL, 'USER_UPDATED', 'USER', 171, '{\"first_name\":\"Has\",\"last_name\":\"Renamed\",\"email\":\"zzphone_tch@hopehaven.edu\",\"phone\":\"0788555555\",\"role\":\"TEACHER\",\"status\":\"ACTIVE\"}', NULL, '2026-10-01 08:06:22'),
(1490, NULL, 'USER_LOGIN', 'USER', 172, 'Login successful', NULL, '2026-10-01 08:07:31'),
(1491, NULL, 'USER_CREATED', 'USER', 173, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 08:07:31'),
(1492, NULL, 'USER_UPDATED', 'USER', 174, '{\"first_name\":\"Has\",\"last_name\":\"Renamed\",\"email\":\"zzphone_tch@hopehaven.edu\",\"phone\":\"0788555555\",\"role\":\"TEACHER\",\"status\":\"ACTIVE\"}', NULL, '2026-10-01 08:07:32'),
(1493, NULL, 'USER_LOGIN', 'USER', 175, 'Login successful', NULL, '2026-10-01 08:08:02'),
(1494, NULL, 'USER_CREATED', 'USER', 176, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 08:08:02'),
(1495, NULL, 'USER_LOGIN', 'USER', 176, 'Login successful', NULL, '2026-10-01 08:08:02'),
(1502, NULL, 'USER_LOGIN', 'USER', 179, 'Login successful', NULL, '2026-10-01 08:08:05'),
(1503, NULL, 'USER_LOGIN', 'USER', 180, 'Login successful', NULL, '2026-10-01 08:08:05'),
(1504, NULL, 'BOOK_BORROWED', 'BORROWING', 120, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 08:08:05'),
(1505, NULL, 'BOOK_RETURNED', 'RETURN', 89, '{\"copy\":\"ZZDESK-C1\",\"fine\":0,\"condition\":\"GOOD\"}', NULL, '2026-10-01 08:08:05');
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1506, NULL, 'BOOK_BORROWED', 'BORROWING', 121, '{\"user\":\"STUZZDESK\",\"copy\":\"ZZDESK-C1\"}', NULL, '2026-10-01 08:08:05'),
(1507, NULL, 'BOOK_BORROWED', 'BORROWING', 122, '{\"user\":\"STUZZDESK\",\"copy\":\"EBKZZDESK-D2\"}', NULL, '2026-10-01 08:08:05'),
(1508, NULL, 'BOOK_RETURNED', 'RETURN', 90, '{\"copy\":\"EBKZZDESK-D2\",\"fine\":0,\"self_service\":true}', NULL, '2026-10-01 08:08:06'),
(1509, NULL, 'USER_LOGIN', 'USER', 181, 'Login successful', NULL, '2026-10-01 08:20:19'),
(1510, NULL, 'USER_CREATED', 'USER', 182, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 08:20:19'),
(1511, NULL, 'USER_CREATED', 'USER', 183, 'Librarian created TEACHER TCH0002', NULL, '2026-10-01 08:20:20'),
(1512, NULL, 'USER_CREATED', 'USER', 184, 'Librarian created GUEST GST0001', NULL, '2026-10-01 08:20:20'),
(1513, NULL, 'USER_LOGIN', 'USER', 185, 'Login successful', NULL, '2026-10-01 08:20:46'),
(1514, NULL, 'USER_CREATED', 'USER', 186, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 08:20:46'),
(1515, NULL, 'USER_UPDATED', 'USER', 187, '{\"first_name\":\"Has\",\"last_name\":\"Renamed\",\"email\":\"zzphone_tch@hopehaven.edu\",\"phone\":\"0788555555\",\"role\":\"TEACHER\",\"status\":\"ACTIVE\"}', NULL, '2026-10-01 08:20:46'),
(1516, NULL, 'USER_LOGIN', 'USER', 188, 'Login successful', NULL, '2026-10-01 08:20:47'),
(1517, NULL, 'USER_CREATED', 'USER', 189, 'Librarian created STUDENT STU0002', NULL, '2026-10-01 08:20:47'),
(1518, NULL, 'USER_LOGIN', 'USER', 189, 'Login successful', NULL, '2026-10-01 08:20:48');

-- --------------------------------------------------------

--
-- Table structure for table `bookmarks`
--

CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ebook_id` int(11) NOT NULL,
  `page_number` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `section` varchar(100) DEFAULT NULL,
  `grade_level` varchar(50) DEFAULT NULL,
  `publisher` varchar(150) DEFAULT NULL,
  `publish_year` int(11) DEFAULT NULL,
  `shelf_location` varchar(50) DEFAULT NULL,
  `total_copies` int(11) NOT NULL DEFAULT 1,
  `available_copies` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `category`, `subject`, `section`, `grade_level`, `publisher`, `publish_year`, `shelf_location`, `total_copies`, `available_copies`, `description`, `cover_image`, `created_at`, `updated_at`) VALUES
(128, 'Biology S1', 'nesa', 'Digital', NULL, NULL, NULL, 'Hope Haven Library', NULL, 'DIGITAL', 1, 1, 'Digital copy of Biology S1', NULL, '2026-09-30 13:05:53', '2026-09-30 14:26:53'),
(131, 'guide to dessection', 'nesa', 'Reference Books', 'Literature', NULL, 'S1', NULL, NULL, NULL, 1, 1, NULL, NULL, '2026-09-30 13:47:42', '2026-10-01 05:15:21'),
(136, 'cfghjkl;\'l', 'sdfghjkl;', 'Reference Books', 'Physics', NULL, 'S1', NULL, NULL, 'fghjkl', 1, 1, NULL, NULL, '2026-10-01 05:12:25', '2026-10-01 08:20:49');

-- --------------------------------------------------------

--
-- Table structure for table `book_copies`
--

CREATE TABLE `book_copies` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `copy_code` varchar(30) NOT NULL,
  `barcode_payload` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'AVAILABLE',
  `retired_reason` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_copies`
--

INSERT INTO `book_copies` (`id`, `book_id`, `copy_code`, `barcode_payload`, `status`, `retired_reason`, `created_at`) VALUES
(221, 128, 'EBK008-D1', NULL, 'AVAILABLE', NULL, '2026-09-30 13:05:53'),
(224, 131, 'HHO5OIYZW55', 'HH1|HHO5OIYZW55|guide to dessection|nesa|Reference Books|Literature|S1|', 'AVAILABLE', NULL, '2026-09-30 13:47:42'),
(241, 136, 'HHO5OIYZW5S', 'HH1|HHO5OIYZW5S|cfghjkl;\'l|sdfghjkl;|Reference Books|Physics|S1|fghjkl', 'AVAILABLE', NULL, '2026-10-01 05:12:25');

-- --------------------------------------------------------

--
-- Table structure for table `borrowings`
--

CREATE TABLE `borrowings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `copy_id` int(11) NOT NULL,
  `borrow_date` datetime NOT NULL DEFAULT current_timestamp(),
  `due_date` datetime NOT NULL,
  `returned_date` datetime DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'BORROWED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `borrowings`
--

INSERT INTO `borrowings` (`id`, `user_id`, `copy_id`, `borrow_date`, `due_date`, `returned_date`, `status`, `created_at`) VALUES
(57, 31, 221, '2026-09-30 15:05:53', '2026-10-14 15:05:53', '2026-09-30 15:07:04', 'RETURNED', '2026-09-30 13:05:53'),
(61, 31, 221, '2026-09-30 15:34:48', '2026-10-14 15:34:48', '2026-09-30 15:35:50', 'RETURNED', '2026-09-30 13:34:48'),
(85, 30, 224, '2026-10-01 07:10:27', '2026-10-15 07:10:27', '2026-10-01 07:15:20', 'RETURNED', '2026-10-01 05:10:27'),
(86, 30, 241, '2026-10-01 07:13:24', '2026-10-15 07:13:24', NULL, 'REJECTED', '2026-10-01 05:13:24'),
(87, 30, 241, '2026-10-01 07:14:03', '2026-10-15 07:14:03', '2026-10-01 07:16:30', 'RETURNED', '2026-10-01 05:14:03'),
(100, 31, 241, '2026-10-01 08:40:36', '2026-10-15 08:40:36', '2026-10-01 08:43:44', 'RETURNED', '2026-10-01 06:40:36'),
(101, 31, 241, '2026-10-01 08:41:06', '2026-10-15 08:41:06', '2026-10-01 08:42:29', 'RETURNED', '2026-10-01 06:41:06');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `code`, `description`, `created_at`, `updated_at`) VALUES
(1, 'CCB', 'CCB', 'Classical Conversations Books', '2026-09-25 07:51:38', '2026-09-25 07:51:38'),
(2, 'Nov Books', 'NOV', 'Novel books', '2026-09-25 07:51:38', '2026-09-25 07:51:38'),
(3, 'Reference Books', 'REF', 'Reference and dictionary books', '2026-09-25 07:51:38', '2026-09-25 07:51:38'),
(4, 'Biblical Books', 'BIB', 'Biblical and spiritual books', '2026-09-25 07:51:38', '2026-09-25 07:51:38');

-- --------------------------------------------------------

--
-- Table structure for table `customer_cards`
--

CREATE TABLE `customer_cards` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `card_number` varchar(50) NOT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `qr_code_data` varchar(500) DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_cards`
--

INSERT INTO `customer_cards` (`id`, `user_id`, `card_number`, `qr_code_url`, `qr_code_data`, `issued_at`, `expires_at`, `status`) VALUES
(62, 1, 'HH-LIB0001-MUE7EZ7R', '/uploads/qrcards/LIB0001_1790174062792.png', 'LIB0001', '2026-09-23 14:34:22', NULL, 'ACTIVE'),
(63, 30, 'HH-STU0001-MUE7EZAH', '/uploads/qrcards/STU0001_1790174062889.png', 'STU0001', '2026-09-23 14:34:22', NULL, 'ACTIVE'),
(64, 31, 'HH-TCH0001-MUE7EZBS', '/uploads/qrcards/TCH0001_1790174062936.png', 'TCH0001', '2026-09-23 14:34:23', NULL, 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `ebooks`
--

CREATE TABLE `ebooks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `section` varchar(100) DEFAULT NULL,
  `grade_level` varchar(50) DEFAULT NULL,
  `isbn` varchar(50) DEFAULT NULL,
  `qr_code` varchar(500) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `format` varchar(10) DEFAULT NULL,
  `is_protected` tinyint(1) NOT NULL DEFAULT 1,
  `access_mode` varchar(20) NOT NULL DEFAULT 'READ_ONLY',
  `cover_image` varchar(500) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ebooks`
--

INSERT INTO `ebooks` (`id`, `title`, `author`, `subject`, `section`, `grade_level`, `isbn`, `qr_code`, `file_path`, `file_size`, `format`, `is_protected`, `access_mode`, `cover_image`, `uploaded_by`, `status`, `created_at`) VALUES
(8, 'Biology S1', 'nesa', 'Biology', 'CCB', 'S1', NULL, NULL, '1790580841645_24c9c744-302a-4770-beda-fcd1987bfcc2.pdf', 56987988, 'PDF', 1, 'READ_ONLY', '/uploads/covers/1790580842461_ee80137a-1add-4249-87bc-923b48c5201b.png', 1, 'ACTIVE', '2026-09-28 07:34:02'),
(9, 'Maths S1 ', 'nesa', 'Maths', 'CCB', 'S1', NULL, NULL, '1790699492196_f9ad9982-c041-439e-adca-08eb48b3de69.pdf', 3947131, 'PDF', 1, 'READ_ONLY', '/uploads/covers/1790699492266_e9fa2b44-f33f-4dcb-84c3-818d6592ea0a.png', 1, 'ACTIVE', '2026-09-29 16:31:32');

-- --------------------------------------------------------

--
-- Table structure for table `fines`
--

CREATE TABLE `fines` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `borrowing_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fine_type` varchar(20) NOT NULL DEFAULT 'OVERDUE',
  `days_overdue` int(11) DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'UNPAID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sender_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `recipient_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `recipient_id`, `subject`, `body`, `is_read`, `sender_deleted`, `recipient_deleted`, `created_at`) VALUES
(1, 1, 31, 'Book ready for pickup', 'Hello Ezras, your requested book is ready for pickup at the library desk. Thank you!', 0, 0, 0, '2026-09-18 13:30:24'),
(2, 1, 31, 'Message', 'hiii', 0, 0, 0, '2026-09-18 13:38:08'),
(3, 1, 30, 'Message', 'amakuru yawe', 1, 0, 0, '2026-09-21 08:47:11'),
(4, 30, 1, 'Re: Message', 'nimeza wowex bite', 1, 0, 0, '2026-09-21 08:47:36');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`) VALUES
(1, 31, 'BOOK_RETURNED', 'Book returned — fine applied', '\"English\" (BOOK034-C1) was returned. A fine of 10000 RWF has been applied.', '{\"borrowing_id\":46,\"book_title\":\"English\",\"copy_code\":\"BOOK034-C1\",\"fine\":10000}', 1, '2026-09-18 12:55:49'),
(2, 31, 'NEW_MESSAGE', 'New message from System Administrator', 'Book ready for pickup — Hello Ezras, your requested book is ready for pickup at the library desk. Thank you!', NULL, 1, '2026-09-18 13:30:24'),
(3, 31, 'NEW_MESSAGE', 'New message from System Administrator', 'hiii', NULL, 1, '2026-09-18 13:38:08'),
(4, 30, 'NEW_MESSAGE', 'New message from System Administrator', 'amakuru yawe', NULL, 1, '2026-09-21 08:47:11'),
(5, 1, 'NEW_MESSAGE', 'New message from mugabo patrick', 'nimeza wowex bite', NULL, 1, '2026-09-21 08:47:36'),
(6, 30, 'BORROW_CONFIRMED', 'E-book available to read', '\"Biology\" (EBK008-D1) has been issued to you. You can read it online in My E-Books now.', '{\"borrowing_id\":49,\"title\":\"Biology\",\"copy_code\":\"EBK008-D1\",\"due_date\":\"2026-10-08T05:50:04.051Z\",\"digital\":true}', 1, '2026-09-24 05:50:04'),
(7, 30, 'BORROW_CONFIRMED', 'E-book available to read', '\"History\" (EBK010-D1) has been issued to you. You can read it online in My E-Books now.', '{\"borrowing_id\":50,\"title\":\"History\",\"copy_code\":\"EBK010-D1\",\"due_date\":\"2026-10-08T05:50:17.102Z\",\"digital\":true}', 1, '2026-09-24 05:50:17'),
(8, 1, 'BOOK_RETURNED', 'Book returned', '\"Kinyarwanda\" (BOOK033-C1) was returned to the library successfully.', '{\"borrowing_id\":47,\"book_title\":\"Kinyarwanda\",\"copy_code\":\"BOOK033-C1\",\"fine\":0}', 1, '2026-09-24 08:26:24'),
(9, 1, 'NEW_MESSAGE', 'New message from Testy Member', 'hii', NULL, 1, '2026-09-24 09:05:56'),
(105, 31, 'BORROW_CONFIRMED', 'E-book available to read', '\"Biology S1\" (EBK008-D1) has been issued to you. You can read it online in My E-Books now.', '{\"borrowing_id\":57,\"title\":\"Biology S1\",\"copy_code\":\"EBK008-D1\",\"due_date\":\"2026-10-14T13:05:53.636Z\",\"digital\":true}', 1, '2026-09-30 13:05:53'),
(112, 31, 'BORROW_CONFIRMED', 'E-book available to read', '\"Biology S1\" (EBK008-D1) has been issued to you. You can read it online in My E-Books now.', '{\"borrowing_id\":61,\"title\":\"Biology S1\",\"copy_code\":\"EBK008-D1\",\"due_date\":\"2026-10-14T13:34:48.384Z\",\"digital\":true}', 1, '2026-09-30 13:34:48'),
(167, 30, 'BORROW_CONFIRMED', 'Book issued by librarian', '\"cfghjkl;\'l\" (HHO5OIYZW5S) has been issued to you by the librarian. Please pick it up and return it by 10/15/2026.', '{\"borrowing_id\":87,\"title\":\"cfghjkl;\'l\",\"copy_code\":\"HHO5OIYZW5S\",\"due_date\":\"2026-10-15T05:14:03.418Z\",\"digital\":false}', 1, '2026-10-01 05:14:03'),
(169, 30, 'BOOK_RETURNED', 'Book returned', '\"cfghjkl;\'l\" (HHO5OIYZW5S) was returned to the library successfully.', '{\"borrowing_id\":87,\"book_title\":\"cfghjkl;\'l\",\"copy_code\":\"HHO5OIYZW5S\",\"fine\":0}', 1, '2026-10-01 05:16:30'),
(191, 31, 'BORROW_CONFIRMED', 'Book issued by librarian', '\"cfghjkl;\'l\" (HHO5OIYZW5S) has been issued to you by the librarian. Please pick it up and return it by 10/15/2026.', '{\"borrowing_id\":101,\"title\":\"cfghjkl;\'l\",\"copy_code\":\"HHO5OIYZW5S\",\"due_date\":\"2026-10-15T06:41:06.793Z\",\"digital\":false}', 1, '2026-10-01 06:41:06'),
(192, 31, 'BOOK_RETURNED', 'Book returned', '\"cfghjkl;\'l\" (HHO5OIYZW5S) was returned to the library successfully.', '{\"borrowing_id\":101,\"book_title\":\"cfghjkl;\'l\",\"copy_code\":\"HHO5OIYZW5S\",\"fine\":0}', 1, '2026-10-01 06:42:29'),
(194, 31, 'BOOK_RETURNED', 'Book returned', '\"cfghjkl;\'l\" (HHO5OIYZW5S) was returned to the library successfully.', '{\"borrowing_id\":100,\"book_title\":\"cfghjkl;\'l\",\"copy_code\":\"HHO5OIYZW5S\",\"fine\":0}', 1, '2026-10-01 06:43:44');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `fine_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(30) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'COMPLETED',
  `paid_at` datetime DEFAULT current_timestamp(),
  `recorded_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `retired_books`
--

CREATE TABLE `retired_books` (
  `id` int(11) NOT NULL,
  `book_id` int(11) DEFAULT NULL,
  `copy_id` int(11) DEFAULT NULL,
  `reason` varchar(50) NOT NULL,
  `retired_by` int(11) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `retired_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `retired_books`
--

INSERT INTO `retired_books` (`id`, `book_id`, `copy_id`, `reason`, `retired_by`, `notes`, `retired_at`) VALUES
(5, NULL, NULL, 'DECOMMISSIONED', 53, 'scanner test cleanup', '2026-09-29 12:54:55'),
(6, NULL, NULL, 'DECOMMISSIONED', 53, 'scanner test cleanup', '2026-09-29 12:54:55');

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `id` int(11) NOT NULL,
  `borrowing_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `copy_id` int(11) NOT NULL,
  `return_date` datetime NOT NULL DEFAULT current_timestamp(),
  `days_overdue` int(11) DEFAULT 0,
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `condition_note` varchar(255) DEFAULT NULL,
  `handled_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `returns`
--

INSERT INTO `returns` (`id`, `borrowing_id`, `user_id`, `book_id`, `copy_id`, `return_date`, `days_overdue`, `fine_amount`, `condition_note`, `handled_by`) VALUES
(44, 57, 31, 128, 221, '2026-09-30 15:07:04', 0, 0.00, 'Self-service return', 31),
(47, 61, 31, 128, 221, '2026-09-30 15:35:50', 0, 0.00, 'Self-service return', 31),
(63, 85, 30, 131, 224, '2026-10-01 07:15:20', 0, 0.00, 'Self-service return', 30),
(64, 87, 30, 136, 241, '2026-10-01 07:16:30', 0, 0.00, NULL, 1),
(75, 101, 31, 136, 241, '2026-10-01 08:42:29', 0, 0.00, NULL, 1),
(76, 100, 31, 136, 241, '2026-10-01 08:43:44', 0, 0.00, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'LIBRARIAN', 'System administrator', '2026-09-09 05:10:28'),
(2, 'STUDENT', 'Student borrower', '2026-09-09 05:10:28'),
(3, 'TEACHER', 'Teacher borrower', '2026-09-09 05:10:28'),
(4, 'GUEST', 'Temporary guest borrower', '2026-09-09 05:10:28');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `level` varchar(5) NOT NULL DEFAULT 'S1',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `category_id`, `name`, `level`, `created_at`, `updated_at`) VALUES
(3, 1, 'Kinyarwanda', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(5, 3, 'Kinyarwanda', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(7, 1, 'Kinyarwanda', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(9, 3, 'Kinyarwanda', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(11, 1, 'Kinyarwanda', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(13, 3, 'Kinyarwanda', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(15, 1, 'Kinyarwanda', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(17, 3, 'Kinyarwanda', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(19, 1, 'Kinyarwanda', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(21, 3, 'Kinyarwanda', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(24, 1, 'English', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(26, 3, 'English', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(28, 1, 'English', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(30, 3, 'English', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(32, 1, 'English', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(34, 3, 'English', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(36, 1, 'English', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(38, 3, 'English', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(40, 1, 'English', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(42, 3, 'English', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(45, 1, 'French', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(47, 3, 'French', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(49, 1, 'French', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(51, 3, 'French', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(53, 1, 'French', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(55, 3, 'French', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(57, 1, 'French', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(59, 3, 'French', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(61, 1, 'French', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(63, 3, 'French', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(66, 1, 'Maths', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(68, 3, 'Maths', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(70, 1, 'Maths', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(72, 3, 'Maths', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(74, 1, 'Maths', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(76, 3, 'Maths', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(78, 1, 'Maths', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(80, 3, 'Maths', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(82, 1, 'Maths', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(84, 3, 'Maths', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(87, 1, 'Physics', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(89, 3, 'Physics', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(91, 1, 'Physics', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(93, 3, 'Physics', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(95, 1, 'Physics', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(97, 3, 'Physics', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(99, 1, 'Physics', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(101, 3, 'Physics', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(103, 1, 'Physics', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(105, 3, 'Physics', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(108, 1, 'Biology', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(110, 3, 'Biology', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(112, 1, 'Biology', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(114, 3, 'Biology', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(116, 1, 'Biology', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(118, 3, 'Biology', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(120, 1, 'Biology', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(122, 3, 'Biology', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(124, 1, 'Biology', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(126, 3, 'Biology', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(129, 1, 'Chemistry', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(131, 3, 'Chemistry', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(133, 1, 'Chemistry', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(135, 3, 'Chemistry', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(137, 1, 'Chemistry', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(139, 3, 'Chemistry', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(141, 1, 'Chemistry', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(143, 3, 'Chemistry', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(145, 1, 'Chemistry', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(147, 3, 'Chemistry', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(150, 1, 'ICT', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(152, 3, 'ICT', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(154, 1, 'ICT', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(156, 3, 'ICT', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(158, 1, 'ICT', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(160, 3, 'ICT', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(162, 1, 'ICT', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(164, 3, 'ICT', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(166, 1, 'ICT', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(168, 3, 'ICT', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(171, 1, 'Entrepreneurships', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(173, 3, 'Entrepreneurships', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(175, 1, 'Entrepreneurships', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(177, 3, 'Entrepreneurships', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(179, 1, 'Entrepreneurships', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(181, 3, 'Entrepreneurships', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(183, 1, 'Entrepreneurships', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(185, 3, 'Entrepreneurships', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(187, 1, 'Entrepreneurships', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(189, 3, 'Entrepreneurships', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(192, 1, 'History', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(194, 3, 'History', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(196, 1, 'History', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(198, 3, 'History', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(200, 1, 'History', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(202, 3, 'History', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(204, 1, 'History', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(206, 3, 'History', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(208, 1, 'History', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(210, 3, 'History', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(213, 1, 'Geography', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(215, 3, 'Geography', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(217, 1, 'Geography', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(219, 3, 'Geography', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(221, 1, 'Geography', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(223, 3, 'Geography', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(225, 1, 'Geography', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(227, 3, 'Geography', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(229, 1, 'Geography', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(231, 3, 'Geography', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(234, 1, 'Literature', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(236, 3, 'Literature', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(238, 1, 'Literature', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(240, 3, 'Literature', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(242, 1, 'Literature', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(244, 3, 'Literature', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(246, 1, 'Literature', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(248, 3, 'Literature', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(250, 1, 'Literature', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(252, 3, 'Literature', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(254, 4, 'Religion', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(255, 1, 'Religion', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(257, 3, 'Religion', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(258, 4, 'Religion', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(259, 1, 'Religion', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(261, 3, 'Religion', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(262, 4, 'Religion', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(263, 1, 'Religion', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(265, 3, 'Religion', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(266, 4, 'Religion', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(267, 1, 'Religion', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(269, 3, 'Religion', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(270, 4, 'Religion', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(271, 1, 'Religion', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(273, 3, 'Religion', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(274, 4, 'Religion', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(276, 1, 'General', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(278, 3, 'General', 'S1', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(280, 1, 'General', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(282, 3, 'General', 'S2', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(284, 1, 'General', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(286, 3, 'General', 'S3', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(288, 1, 'General', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(290, 3, 'General', 'S4', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(292, 1, 'General', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(294, 3, 'General', 'S5', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(296, 1, 'Kinyarwanda', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(298, 3, 'Kinyarwanda', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(299, 1, 'English', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(301, 3, 'English', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(302, 1, 'French', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(304, 3, 'French', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(305, 1, 'Maths', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(307, 3, 'Maths', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(308, 1, 'Physics', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(310, 3, 'Physics', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(311, 1, 'Biology', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(313, 3, 'Biology', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(314, 1, 'Chemistry', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(316, 3, 'Chemistry', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(317, 1, 'ICT', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(319, 3, 'ICT', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(320, 1, 'Entrepreneurships', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(322, 3, 'Entrepreneurships', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(323, 1, 'History', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(325, 3, 'History', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(326, 1, 'Geography', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(328, 3, 'Geography', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(329, 1, 'Literature', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(331, 3, 'Literature', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(332, 1, 'Religion', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(334, 3, 'Religion', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(335, 1, 'General', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18'),
(337, 3, 'General', 'S6', '2026-09-25 07:55:18', '2026-09-25 07:55:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `class_name` varchar(50) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'STUDENT',
  `role_id` int(11) DEFAULT NULL,
  `customer_id` varchar(20) NOT NULL,
  `physical_card_no` varchar(30) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `blocked_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `class_name`, `profile_image`, `password`, `role`, `role_id`, `customer_id`, `physical_card_no`, `status`, `blocked_reason`, `created_at`, `updated_at`) VALUES
(1, 'System', 'Administrator', 'librarian@hopehavenschool.org', '0788000000', '', '/uploads/profiles/profile_1_1789108060410.png', '$2a$12$2rN7ozxacx1rIu5HtdghxedF4gLKNs2g8jrglVc.SWWVkYUFINB1W', 'LIBRARIAN', NULL, 'LIB0001', '10292358', 'ACTIVE', NULL, '2026-09-09 08:23:20', '2026-09-30 13:40:20'),
(30, 'mugabo', 'patrick', 'mugabo.patrick1312@hopehavenschool.org', '0788888888', 'S1', '/uploads/profiles/profile_30_1790773122108.png', '$2a$10$Y4JCVQQ82GRxD9E6h6qmw.SeFjOd7jzneTO7Pc8b5sI2s1XFI9OkC', 'STUDENT', NULL, 'STU0001', '', 'ACTIVE', NULL, '2026-09-17 09:16:13', '2026-09-30 13:39:29'),
(31, 'Ezras', 'MITWERI', 'ezras.mitweri1312@hopehavenschool.org', '0799999999', '', '/uploads/profiles/profile_31_1790773235845.png', '$2a$10$GsIG8sfrcLg3V19QZuh26eJ3r8nmrt4BGBAidntEoas4HyVV54OhG', 'TEACHER', NULL, 'TCH0001', '', 'ACTIVE', NULL, '2026-09-17 09:18:42', '2026-09-30 13:39:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account_requests`
--
ALTER TABLE `account_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ebook_id` (`ebook_id`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `book_copies`
--
ALTER TABLE `book_copies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `copy_code` (`copy_code`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `idx_copy_payload` (`barcode_payload`);

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `copy_id` (`copy_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `customer_cards`
--
ALTER TABLE `customer_cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `card_number` (`card_number`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `ebooks`
--
ALTER TABLE `ebooks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `fines`
--
ALTER TABLE `fines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `borrowing_id` (`borrowing_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_msg_sender` (`sender_id`,`sender_deleted`,`created_at`),
  ADD KEY `idx_msg_recipient` (`recipient_id`,`is_read`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_user` (`user_id`,`is_read`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fine_id` (`fine_id`);

--
-- Indexes for table `retired_books`
--
ALTER TABLE `retired_books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `copy_id` (`copy_id`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `borrowing_id` (`borrowing_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `copy_id` (`copy_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cat_subject_level` (`category_id`,`name`,`level`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `customer_id` (`customer_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account_requests`
--
ALTER TABLE `account_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1525;

--
-- AUTO_INCREMENT for table `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- AUTO_INCREMENT for table `book_copies`
--
ALTER TABLE `book_copies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=274;

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `customer_cards`
--
ALTER TABLE `customer_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `ebooks`
--
ALTER TABLE `ebooks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `fines`
--
ALTER TABLE `fines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=241;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `retired_books`
--
ALTER TABLE `retired_books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=515;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=192;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookmarks_ibfk_2` FOREIGN KEY (`ebook_id`) REFERENCES `ebooks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `book_copies`
--
ALTER TABLE `book_copies`
  ADD CONSTRAINT `book_copies_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD CONSTRAINT `borrowings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `borrowings_ibfk_2` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_cards`
--
ALTER TABLE `customer_cards`
  ADD CONSTRAINT `customer_cards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ebooks`
--
ALTER TABLE `ebooks`
  ADD CONSTRAINT `ebooks_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `fines`
--
ALTER TABLE `fines`
  ADD CONSTRAINT `fines_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fines_ibfk_2` FOREIGN KEY (`borrowing_id`) REFERENCES `borrowings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`fine_id`) REFERENCES `fines` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `retired_books`
--
ALTER TABLE `retired_books`
  ADD CONSTRAINT `retired_books_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `retired_books_ibfk_2` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `returns_ibfk_1` FOREIGN KEY (`borrowing_id`) REFERENCES `borrowings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `returns_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `returns_ibfk_3` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  ADD CONSTRAINT `returns_ibfk_4` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`id`);

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
--
-- Database: `phpmyadmin`
--
CREATE DATABASE IF NOT EXISTS `phpmyadmin` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE `phpmyadmin`;

-- --------------------------------------------------------

--
-- Table structure for table `pma__bookmark`
--

CREATE TABLE `pma__bookmark` (
  `id` int(10) UNSIGNED NOT NULL,
  `dbase` varchar(255) NOT NULL DEFAULT '',
  `user` varchar(255) NOT NULL DEFAULT '',
  `label` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `query` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Bookmarks';

-- --------------------------------------------------------

--
-- Table structure for table `pma__central_columns`
--

CREATE TABLE `pma__central_columns` (
  `db_name` varchar(64) NOT NULL,
  `col_name` varchar(64) NOT NULL,
  `col_type` varchar(64) NOT NULL,
  `col_length` text DEFAULT NULL,
  `col_collation` varchar(64) NOT NULL,
  `col_isNull` tinyint(1) NOT NULL,
  `col_extra` varchar(255) DEFAULT '',
  `col_default` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Central list of columns';

-- --------------------------------------------------------

--
-- Table structure for table `pma__column_info`
--

CREATE TABLE `pma__column_info` (
  `id` int(5) UNSIGNED NOT NULL,
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `comment` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `mimetype` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `transformation` varchar(255) NOT NULL DEFAULT '',
  `transformation_options` varchar(255) NOT NULL DEFAULT '',
  `input_transformation` varchar(255) NOT NULL DEFAULT '',
  `input_transformation_options` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Column information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__designer_settings`
--

CREATE TABLE `pma__designer_settings` (
  `username` varchar(64) NOT NULL,
  `settings_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Settings related to Designer';

--
-- Dumping data for table `pma__designer_settings`
--

INSERT INTO `pma__designer_settings` (`username`, `settings_data`) VALUES
('root', '{\"relation_lines\":\"true\",\"angular_direct\":\"direct\",\"snap_to_grid\":\"off\"}');

-- --------------------------------------------------------

--
-- Table structure for table `pma__export_templates`
--

CREATE TABLE `pma__export_templates` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL,
  `export_type` varchar(10) NOT NULL,
  `template_name` varchar(64) NOT NULL,
  `template_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved export templates';

-- --------------------------------------------------------

--
-- Table structure for table `pma__favorite`
--

CREATE TABLE `pma__favorite` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Favorite tables';

-- --------------------------------------------------------

--
-- Table structure for table `pma__history`
--

CREATE TABLE `pma__history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db` varchar(64) NOT NULL DEFAULT '',
  `table` varchar(64) NOT NULL DEFAULT '',
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp(),
  `sqlquery` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='SQL history for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__navigationhiding`
--

CREATE TABLE `pma__navigationhiding` (
  `username` varchar(64) NOT NULL,
  `item_name` varchar(64) NOT NULL,
  `item_type` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Hidden items of navigation tree';

-- --------------------------------------------------------

--
-- Table structure for table `pma__pdf_pages`
--

CREATE TABLE `pma__pdf_pages` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `page_nr` int(10) UNSIGNED NOT NULL,
  `page_descr` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='PDF relation pages for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__recent`
--

CREATE TABLE `pma__recent` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Recently accessed tables';

--
-- Dumping data for table `pma__recent`
--

INSERT INTO `pma__recent` (`username`, `tables`) VALUES
('root', '[{\"db\":\"hope_haven_library\",\"table\":\"account_requests\"},{\"db\":\"hope_haven_library\",\"table\":\"audit_logs\"},{\"db\":\"hope_haven_library\",\"table\":\"bookmarks\"},{\"db\":\"hope_haven_library\",\"table\":\"books\"},{\"db\":\"hope_haven_library\",\"table\":\"borrowings\"},{\"db\":\"hope_haven_library\",\"table\":\"book_copies\"},{\"db\":\"hope_haven_library\",\"table\":\"fines\"},{\"db\":\"hope_haven_library\",\"table\":\"notifications\"},{\"db\":\"hope_haven_library\",\"table\":\"payments\"},{\"db\":\"hope_haven_library\",\"table\":\"retired_books\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `pma__relation`
--

CREATE TABLE `pma__relation` (
  `master_db` varchar(64) NOT NULL DEFAULT '',
  `master_table` varchar(64) NOT NULL DEFAULT '',
  `master_field` varchar(64) NOT NULL DEFAULT '',
  `foreign_db` varchar(64) NOT NULL DEFAULT '',
  `foreign_table` varchar(64) NOT NULL DEFAULT '',
  `foreign_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Relation table';

-- --------------------------------------------------------

--
-- Table structure for table `pma__savedsearches`
--

CREATE TABLE `pma__savedsearches` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `search_name` varchar(64) NOT NULL DEFAULT '',
  `search_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved searches';

-- --------------------------------------------------------

--
-- Table structure for table `pma__table_coords`
--

CREATE TABLE `pma__table_coords` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `pdf_page_number` int(11) NOT NULL DEFAULT 0,
  `x` float UNSIGNED NOT NULL DEFAULT 0,
  `y` float UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table coordinates for phpMyAdmin PDF output';

-- --------------------------------------------------------

--
-- Table structure for table `pma__table_info`
--

CREATE TABLE `pma__table_info` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `display_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__table_uiprefs`
--

CREATE TABLE `pma__table_uiprefs` (
  `username` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `prefs` text NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Tables'' UI preferences';

-- --------------------------------------------------------

--
-- Table structure for table `pma__tracking`
--

CREATE TABLE `pma__tracking` (
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `version` int(10) UNSIGNED NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime NOT NULL,
  `schema_snapshot` text NOT NULL,
  `schema_sql` text DEFAULT NULL,
  `data_sql` longtext DEFAULT NULL,
  `tracking` set('UPDATE','REPLACE','INSERT','DELETE','TRUNCATE','CREATE DATABASE','ALTER DATABASE','DROP DATABASE','CREATE TABLE','ALTER TABLE','RENAME TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','ALTER VIEW','DROP VIEW') DEFAULT NULL,
  `tracking_active` int(1) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Database changes tracking for phpMyAdmin';

-- --------------------------------------------------------

--
-- Table structure for table `pma__userconfig`
--

CREATE TABLE `pma__userconfig` (
  `username` varchar(64) NOT NULL,
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `config_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User preferences storage for phpMyAdmin';

--
-- Dumping data for table `pma__userconfig`
--

INSERT INTO `pma__userconfig` (`username`, `timevalue`, `config_data`) VALUES
('root', '2026-09-24 05:09:08', '{\"Console\\/Mode\":\"collapse\"}');

-- --------------------------------------------------------

--
-- Table structure for table `pma__usergroups`
--

CREATE TABLE `pma__usergroups` (
  `usergroup` varchar(64) NOT NULL,
  `tab` varchar(64) NOT NULL,
  `allowed` enum('Y','N') NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User groups with configured menu items';

-- --------------------------------------------------------

--
-- Table structure for table `pma__users`
--

CREATE TABLE `pma__users` (
  `username` varchar(64) NOT NULL,
  `usergroup` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Users and their assignments to user groups';

--
-- Indexes for dumped tables
--

--
-- Indexes for table `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pma__central_columns`
--
ALTER TABLE `pma__central_columns`
  ADD PRIMARY KEY (`db_name`,`col_name`);

--
-- Indexes for table `pma__column_info`
--
ALTER TABLE `pma__column_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `db_name` (`db_name`,`table_name`,`column_name`);

--
-- Indexes for table `pma__designer_settings`
--
ALTER TABLE `pma__designer_settings`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_user_type_template` (`username`,`export_type`,`template_name`);

--
-- Indexes for table `pma__favorite`
--
ALTER TABLE `pma__favorite`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__history`
--
ALTER TABLE `pma__history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`,`db`,`table`,`timevalue`);

--
-- Indexes for table `pma__navigationhiding`
--
ALTER TABLE `pma__navigationhiding`
  ADD PRIMARY KEY (`username`,`item_name`,`item_type`,`db_name`,`table_name`);

--
-- Indexes for table `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  ADD PRIMARY KEY (`page_nr`),
  ADD KEY `db_name` (`db_name`);

--
-- Indexes for table `pma__recent`
--
ALTER TABLE `pma__recent`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__relation`
--
ALTER TABLE `pma__relation`
  ADD PRIMARY KEY (`master_db`,`master_table`,`master_field`),
  ADD KEY `foreign_field` (`foreign_db`,`foreign_table`);

--
-- Indexes for table `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_savedsearches_username_dbname` (`username`,`db_name`,`search_name`);

--
-- Indexes for table `pma__table_coords`
--
ALTER TABLE `pma__table_coords`
  ADD PRIMARY KEY (`db_name`,`table_name`,`pdf_page_number`);

--
-- Indexes for table `pma__table_info`
--
ALTER TABLE `pma__table_info`
  ADD PRIMARY KEY (`db_name`,`table_name`);

--
-- Indexes for table `pma__table_uiprefs`
--
ALTER TABLE `pma__table_uiprefs`
  ADD PRIMARY KEY (`username`,`db_name`,`table_name`);

--
-- Indexes for table `pma__tracking`
--
ALTER TABLE `pma__tracking`
  ADD PRIMARY KEY (`db_name`,`table_name`,`version`);

--
-- Indexes for table `pma__userconfig`
--
ALTER TABLE `pma__userconfig`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `pma__usergroups`
--
ALTER TABLE `pma__usergroups`
  ADD PRIMARY KEY (`usergroup`,`tab`,`allowed`);

--
-- Indexes for table `pma__users`
--
ALTER TABLE `pma__users`
  ADD PRIMARY KEY (`username`,`usergroup`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__column_info`
--
ALTER TABLE `pma__column_info`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__history`
--
ALTER TABLE `pma__history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  MODIFY `page_nr` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- Database: `test`
--
CREATE DATABASE IF NOT EXISTS `test` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `test`;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
