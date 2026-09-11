-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 11, 2026 at 05:22 PM
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
(22, 4, 'USER_LOGIN_QR', 'USER', 4, 'Logged in via QR code', NULL, '2026-09-09 16:47:55'),
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
(40, 5, 'USER_LOGIN_QR', 'USER', 5, 'Logged in via QR code', NULL, '2026-09-10 10:05:12'),
(41, 4, 'USER_LOGIN_QR', 'USER', 4, 'Logged in via QR code', NULL, '2026-09-10 10:07:09'),
(42, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-10 10:08:16'),
(43, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 10:12:18'),
(44, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 11:17:32'),
(45, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 11:17:38'),
(46, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 11:17:43'),
(47, 1, 'BOOK_ADDED', 'BOOK', 4, 'The Great Gatsby (9780743273565), 3 copies', NULL, '2026-09-10 12:02:42'),
(48, 1, 'BOOK_ADDED', 'BOOK', 5, 'To Kill a Mockingbird (9780060935467), 3 copies', NULL, '2026-09-10 12:02:51'),
(49, 1, 'BOOK_ADDED', 'BOOK', 6, '1984 (9780451524935), 3 copies', NULL, '2026-09-10 12:02:59'),
(50, 1, 'BOOK_ADDED', 'BOOK', 7, 'The Hobbit (9780547928227), 2 copies', NULL, '2026-09-10 12:03:08'),
(51, 1, 'BOOK_ADDED', 'BOOK', 8, 'Pride and Prejudice (9780141439518), 2 copies', NULL, '2026-09-10 12:03:16'),
(52, 1, 'BOOK_ADDED', 'BOOK', 9, 'Animal Farm (9780452284241), 2 copies', NULL, '2026-09-10 12:03:25'),
(53, 1, 'BOOK_ADDED', 'BOOK', 10, 'Harry Potter and the Sorcerer\'s Stone (9780439554930), 3 copies', NULL, '2026-09-10 12:03:34'),
(54, 1, 'BOOK_ADDED', 'BOOK', 11, 'The Catcher in the Rye (9780316769488), 2 copies', NULL, '2026-09-10 12:03:42'),
(55, 1, 'BOOK_ADDED', 'BOOK', 12, 'Lord of the Flies (9780140283334), 2 copies', NULL, '2026-09-10 12:03:51'),
(56, 1, 'BOOK_ADDED', 'BOOK', 13, 'The Alchemist (9780061122415), 2 copies', NULL, '2026-09-10 12:04:00'),
(57, 1, 'BOOK_ADDED', 'BOOK', 14, 'Atomic Habits (9780735211292), 2 copies', NULL, '2026-09-10 12:04:09'),
(58, 1, 'BOOK_ADDED', 'BOOK', 15, 'Educated (9780399590504), 2 copies', NULL, '2026-09-10 12:04:19'),
(59, 1, 'BOOK_ADDED', 'BOOK', 16, 'A Brief History of Time (9780553380163), 2 copies', NULL, '2026-09-10 12:04:28'),
(60, 1, 'BOOK_ADDED', 'BOOK', 17, 'Becoming (9781524763138), 2 copies', NULL, '2026-09-10 12:04:37'),
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
(76, 1, 'EBOOK_UPLOADED', 'EBOOK', 4, 'Rwandan History: Kingdom to Republic', NULL, '2026-09-10 12:05:22'),
(77, 1, 'EBOOK_UPLOADED', 'EBOOK', 5, 'Computer Basics for Students', NULL, '2026-09-10 12:05:30'),
(78, 1, 'EBOOK_UPLOADED', 'EBOOK', 6, 'Physics in Everyday Life', NULL, '2026-09-10 12:05:39'),
(79, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 12:13:10'),
(80, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 12:14:09'),
(81, 5, 'USER_LOGIN_QR', 'USER', 5, 'Logged in via QR code', NULL, '2026-09-10 12:14:52'),
(82, 4, 'USER_LOGIN_QR', 'USER', 4, 'Logged in via QR code', NULL, '2026-09-10 12:15:13'),
(83, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-10 12:15:31'),
(84, 7, 'USER_LOGIN_QR', 'USER', 7, 'Logged in via QR code', NULL, '2026-09-10 12:19:19'),
(85, 7, 'USER_LOGIN', 'USER', 7, 'Login successful', NULL, '2026-09-10 12:19:31'),
(86, 6, 'EBOOK_READ', 'EBOOK', 5, 'Computer Basics for Students', NULL, '2026-09-10 12:21:02'),
(87, 6, 'EBOOK_READ', 'EBOOK', 5, 'Computer Basics for Students', NULL, '2026-09-10 12:21:10'),
(88, 6, 'EBOOK_READ', 'EBOOK', 4, 'Rwandan History: Kingdom to Republic', NULL, '2026-09-10 12:21:15'),
(89, 6, 'EBOOK_READ', 'EBOOK', 6, 'Physics in Everyday Life', NULL, '2026-09-10 12:21:44'),
(90, 6, 'EBOOK_READ', 'EBOOK', 5, 'Computer Basics for Students', NULL, '2026-09-10 12:21:47'),
(91, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-10 12:28:23'),
(92, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-10 12:29:04'),
(93, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 12:29:04'),
(94, 4, 'BOOK_BORROWED', 'BORROWING', 21, '{\"user\":\"STU0001\",\"copy\":\"BOOK018-C1\"}', NULL, '2026-09-10 12:29:04'),
(95, 1, 'BOOK_RETURNED', 'RETURN', 12, '{\"copy\":\"BOOK018-C1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 12:29:04'),
(96, 6, 'BOOK_BORROWED', 'BORROWING', 22, '{\"user\":\"STU0002\",\"copy\":\"BOOK013-C1\"}', NULL, '2026-09-10 12:32:45'),
(97, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-10 12:57:00'),
(98, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:29:13'),
(99, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-10 13:29:13'),
(100, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:29:59'),
(101, 1, 'USER_LOGIN', 'USER', 1, 'Login successful', NULL, '2026-09-10 13:30:15'),
(102, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-10 13:30:15'),
(103, 1, 'BOOK_BORROWED', 'BORROWING', 23, '{\"user\":\"STU0001\",\"copy\":\"BOOK001-C1\"}', NULL, '2026-09-10 13:30:15'),
(104, 1, 'BOOK_RETURNED', 'RETURN', 13, '{\"copy\":\"BOOK001-C1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 13:30:15'),
(105, 4, 'BOOK_BORROWED', 'BORROWING', 24, '{\"user\":\"STU0001\",\"copy\":\"BOOK002-C1\"}', NULL, '2026-09-10 13:30:15'),
(106, 1, 'BOOK_RETURNED', 'RETURN', 14, '{\"copy\":\"BOOK002-C1\",\"fine\":0,\"condition\":null}', NULL, '2026-09-10 13:30:15'),
(107, 1, 'EBOOK_DELETED', 'EBOOK', 6, 'Physics in Everyday Life', NULL, '2026-09-10 13:38:25'),
(108, 1, 'EBOOK_DELETED', 'EBOOK', 4, 'Rwandan History: Kingdom to Republic', NULL, '2026-09-10 13:38:28'),
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
(120, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-10 14:33:24'),
(121, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-10 14:34:16'),
(122, 4, 'EBOOK_READ', 'EBOOK', 8, 'Biology', NULL, '2026-09-10 14:34:16'),
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
(161, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-11 09:22:27'),
(162, 7, 'USER_LOGIN_QR', 'USER', 7, 'Logged in via QR code', NULL, '2026-09-11 09:31:23'),
(163, 7, 'USER_LOGIN_QR', 'USER', 7, 'Logged in via QR code', NULL, '2026-09-11 09:31:23'),
(164, 7, 'USER_LOGIN_QR', 'USER', 7, 'Logged in via QR code', NULL, '2026-09-11 09:31:23'),
(165, 5, 'USER_LOGIN_QR', 'USER', 5, 'Logged in via QR code', NULL, '2026-09-11 09:34:22'),
(166, 4, 'USER_LOGIN_QR', 'USER', 4, 'Logged in via QR code', NULL, '2026-09-11 09:34:35'),
(167, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-11 09:34:55'),
(168, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 09:37:59'),
(169, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-11 09:48:47'),
(170, 6, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-11 10:01:16'),
(171, 6, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-11 10:35:35'),
(172, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 10:37:06'),
(173, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 10:37:31'),
(174, 4, 'BOOK_BORROWED', 'BORROWING', 29, '{\"user\":\"STU0001\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-11 10:37:31'),
(175, 6, 'BOOK_BORROWED', 'BORROWING', 30, '{\"user\":\"STU0002\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-11 10:47:03'),
(176, 6, 'BOOK_BORROWED', 'BORROWING', 31, '{\"user\":\"STU0002\",\"copy\":\"EBK015-D1\"}', NULL, '2026-09-11 10:54:10'),
(177, 6, 'BOOK_BORROWED', 'BORROWING', 32, '{\"user\":\"STU0002\",\"copy\":\"EBK014-D1\"}', NULL, '2026-09-11 10:58:17'),
(178, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 11:03:16'),
(179, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 11:04:16'),
(180, 4, 'BULK_FINE_PAID', 'FINE', NULL, 'Paid 1 fines totaling 1200', NULL, '2026-09-11 11:04:16'),
(181, 6, 'BOOK_BORROWED', 'BORROWING', 33, '{\"user\":\"STU0002\",\"copy\":\"EBK016-D1\"}', NULL, '2026-09-11 11:06:09'),
(182, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 11:08:25'),
(183, 4, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-11 11:08:26'),
(184, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 11:10:04'),
(185, 4, 'BOOK_BORROWED', 'BORROWING', 34, '{\"user\":\"STU0001\",\"copy\":\"EBK008-D1\"}', NULL, '2026-09-11 11:10:04'),
(186, 4, 'EBOOK_READ', 'EBOOK', 16, 'Kinyarwanda', NULL, '2026-09-11 11:10:04'),
(187, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 11:13:48'),
(191, 4, 'BOOK_RETURNED', 'RETURN', 19, '{\"copy\":\"EBK008-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-11 11:13:48'),
(193, 4, 'BOOK_RETURNED', 'RETURN', 20, '{\"copy\":\"EBK009-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-11 11:13:48'),
(194, 4, 'BOOK_RETURNED', 'RETURN', 21, '{\"copy\":\"EBK011-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-11 11:13:48'),
(195, 4, 'BOOK_RETURNED', 'RETURN', 22, '{\"copy\":\"EBK010-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-11 11:13:48'),
(196, 4, 'USER_LOGIN', 'USER', 4, 'Login successful', NULL, '2026-09-11 11:24:01'),
(198, 4, 'EBOOK_DOWNLOAD', 'EBOOK', 8, '{\"title\":\"Biology\",\"format\":\"PDF\"}', NULL, '2026-09-11 11:24:01'),
(199, 4, 'BOOK_RETURNED', 'RETURN', 23, '{\"copy\":\"EBK008-D1\",\"fine\":0,\"self_service\":true}', NULL, '2026-09-11 11:24:03'),
(200, 6, 'EBOOK_DOWNLOAD', 'EBOOK', 16, '{\"title\":\"Kinyarwanda\",\"format\":\"PDF\"}', NULL, '2026-09-11 11:53:50'),
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
(226, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-11 13:50:14'),
(227, 6, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-11 13:52:00'),
(228, 6, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-11 13:52:17'),
(229, 5, 'USER_LOGIN_QR', 'USER', 5, 'Logged in via QR code', NULL, '2026-09-11 13:56:18'),
(230, 5, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-11 13:57:26'),
(231, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 13:57:49'),
(232, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 14:50:49'),
(233, 1, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-11 14:52:52'),
(234, 6, 'USER_LOGIN_QR', 'USER', 6, 'Logged in via QR code', NULL, '2026-09-11 14:54:07'),
(235, 6, 'EBOOK_READ', 'EBOOK', 15, 'English', NULL, '2026-09-11 14:55:06'),
(236, 1, 'USER_LOGIN_QR', 'USER', 1, 'Logged in via QR code', NULL, '2026-09-11 15:00:47'),
(237, 4, 'USER_LOGIN_QR', 'USER', 4, 'Logged in via QR code', NULL, '2026-09-11 15:05:36'),
(238, 4, 'BOOK_BORROWED', 'BORROWING', 40, '{\"user\":\"STU0001\",\"copy\":\"EBK015-D1\"}', NULL, '2026-09-11 15:06:06'),
(239, 4, 'EBOOK_DOWNLOAD', 'EBOOK', 15, '{\"title\":\"English\",\"format\":\"PDF\"}', NULL, '2026-09-11 15:06:06'),
(240, 4, 'EBOOK_READ', 'EBOOK', 14, 'French', NULL, '2026-09-11 15:07:12'),
(241, 4, 'EBOOK_DOWNLOAD', 'EBOOK', 14, '{\"title\":\"French\",\"format\":\"PDF\"}', NULL, '2026-09-11 15:07:39');

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

INSERT INTO `books` (`id`, `title`, `author`, `category`, `publisher`, `publish_year`, `shelf_location`, `total_copies`, `available_copies`, `description`, `cover_image`, `created_at`, `updated_at`) VALUES
(25, 'Kinyarwanda', 'nesa', 'Digital', 'Hope Haven Library', NULL, 'DIGITAL', 1, 0, 'Digital copy of Kinyarwanda', NULL, '2026-09-11 11:06:09', '2026-09-11 11:06:09'),
(32, 'English', 'nesa', 'Digital', 'Hope Haven Library', NULL, 'DIGITAL', 1, 0, 'Digital copy of English', NULL, '2026-09-11 15:06:06', '2026-09-11 15:06:06');

-- --------------------------------------------------------

--
-- Table structure for table `book_copies`
--

CREATE TABLE `book_copies` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `copy_code` varchar(30) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'AVAILABLE',
  `retired_reason` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `book_copies`
--

INSERT INTO `book_copies` (`id`, `book_id`, `copy_code`, `status`, `retired_reason`, `created_at`) VALUES
(53, 25, 'EBK016-D1', 'BORROWED', NULL, '2026-09-11 11:06:09'),
(60, 32, 'EBK015-D1', 'BORROWED', NULL, '2026-09-11 15:06:06');

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
(33, 6, 53, '2026-09-11 13:06:09', '2026-09-18 13:06:09', NULL, 'BORROWED', '2026-09-11 11:06:09'),
(40, 4, 60, '2026-09-11 17:06:06', '2026-09-25 17:06:06', NULL, 'BORROWED', '2026-09-11 15:06:06');

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
(4, 1, 'HH-LIB0001-MTUAEZVL', '/uploads/qrcards/LIB0001_1789133173472.png', '{\"data\":{\"customer_id\":\"LIB0001\",\"uid\":1,\"ts\":1789133173472,\"full_name\":\"System Administrator\",\"role\":\"LIBRARIAN\",\"email\":\"librarian@hopehaven.edu\",\"phone\":\"0788000000\",\"card_number\":\"HH-LIB0001-MTUAEZVL\"},\"sig\":\"964f66425f2c2f0419eed6f78a17b9255cf7ab8cab7fa7664ae49f47bfbe4dab\"}', '2026-09-09 16:02:58', NULL, 'ACTIVE'),
(8, 6, 'HH-STU0002-MTVCX19Z', '/uploads/qrcards/STU0002_1789133173514.png', '{\"data\":{\"customer_id\":\"STU0002\",\"uid\":6,\"ts\":1789133173514,\"full_name\":\"mugabo patrick\",\"role\":\"STUDENT\",\"email\":\"patrick@hopehaven.edu\",\"phone\":\"0788888888888\",\"card_number\":\"HH-STU0002-MTVCX19Z\"},\"sig\":\"66af46dc06860ee918e958ba6bb6fc7d2d601acefe5bd84fadd45d020c9453e2\"}', '2026-09-10 10:00:46', NULL, 'ACTIVE'),
(9, 4, 'HH-STU0001-MTVCXC18', '/uploads/qrcards/STU0001_1789133173537.png', '{\"data\":{\"customer_id\":\"STU0001\",\"uid\":4,\"ts\":1789133173537,\"full_name\":\"John Doe\",\"role\":\"STUDENT\",\"email\":\"student@hopehaven.edu\",\"phone\":\"0788111111\",\"card_number\":\"HH-STU0001-MTVCXC18\"},\"sig\":\"32808b6fddda633e96b3930a68dd0ddc5dd1eead3d4fdde046c8afdf6e733b53\"}', '2026-09-10 10:00:59', NULL, 'ACTIVE'),
(10, 5, 'HH-TCH0001-MTVCXNOU', '/uploads/qrcards/TCH0001_1789133173553.png', '{\"data\":{\"customer_id\":\"TCH0001\",\"uid\":5,\"ts\":1789133173553,\"full_name\":\"Jane Smith\",\"role\":\"TEACHER\",\"email\":\"teacher@hopehaven.edu\",\"phone\":\"0788222222\",\"card_number\":\"HH-TCH0001-MTVCXNOU\"},\"sig\":\"9330e90d2a71b3eaea238b38a0a95573007831360bad19e5f0417d24dc0ce5b3\"}', '2026-09-10 10:01:15', NULL, 'ACTIVE'),
(22, 17, 'HH-GST0002-MTX0BE4S', '/uploads/qrcards/GST0002_1789134213197.png', '{\"data\":{\"customer_id\":\"GST0002\",\"uid\":17,\"ts\":1789134213197,\"full_name\":\"Aimee Umutoni\",\"role\":\"GUEST\",\"email\":\"aimee@hopehaven.edu\",\"phone\":\"0790444444\",\"card_number\":\"HH-GST0002-MTX0BE4S\"},\"sig\":\"a1cc843c2a31b2c874fcf7a08a75a76d5b6e9489aaa0cf3e5eb699220a2bfd03\"}', '2026-09-11 13:43:33', NULL, 'ACTIVE'),
(23, 7, 'HH-STU0003-MTX0BLQ8', '/uploads/qrcards/STU0003_1789134223041.png', '{\"data\":{\"customer_id\":\"STU0003\",\"uid\":7,\"ts\":1789134223041,\"full_name\":\"Alice Uwase\",\"role\":\"STUDENT\",\"email\":\"alice@hopehaven.edu\",\"phone\":\"0788333333\",\"card_number\":\"HH-STU0003-MTX0BLQ8\"},\"sig\":\"7800f221966c3a61cb4363e490bb8769afd8b9d4a1d9905d565b1e34abef92bc\"}', '2026-09-11 13:43:43', NULL, 'ACTIVE'),
(24, 8, 'HH-STU0004-MTX0HWJ4', '/uploads/qrcards/STU0004_1789134516977.png', '{\"data\":{\"customer_id\":\"STU0004\",\"uid\":8,\"ts\":1789134516976,\"full_name\":\"Eric Mugisha\",\"role\":\"STUDENT\",\"email\":\"eric@hopehaven.edu\",\"phone\":\"0788444444\",\"card_number\":\"HH-STU0004-MTX0HWJ4\"},\"sig\":\"bbd8a7bff7e4078a09b423beec3d961b6832ec9c9a3ba45c6d5c66855015b6ba\"}', '2026-09-11 13:48:37', NULL, 'ACTIVE'),
(25, 9, 'HH-STU0005-MTX0HZSX', '/uploads/qrcards/STU0005_1789134521218.png', '{\"data\":{\"customer_id\":\"STU0005\",\"uid\":9,\"ts\":1789134521217,\"full_name\":\"Grace Niyonzima\",\"role\":\"STUDENT\",\"email\":\"grace@hopehaven.edu\",\"phone\":\"0788555555\",\"card_number\":\"HH-STU0005-MTX0HZSX\"},\"sig\":\"5a734faaf0ca16021ae478562043fe7f2722a0d0b5b4cbb69bef8eb885f66ce4\"}', '2026-09-11 13:48:41', NULL, 'ACTIVE'),
(26, 10, 'HH-STU0006-MTX0I407', '/uploads/qrcards/STU0006_1789134526664.png', '{\"data\":{\"customer_id\":\"STU0006\",\"uid\":10,\"ts\":1789134526664,\"full_name\":\"Kevin Habimana\",\"role\":\"STUDENT\",\"email\":\"kevin@hopehaven.edu\",\"phone\":\"0788666666\",\"card_number\":\"HH-STU0006-MTX0I407\"},\"sig\":\"007d64cb1e728c1a9f9fca0f71ba5af5568c5f94b4a3be2c1694e3ab10e79868\"}', '2026-09-11 13:48:46', NULL, 'ACTIVE'),
(27, 11, 'HH-STU0007-MTX0I7LC', '/uploads/qrcards/STU0007_1789134531313.png', '{\"data\":{\"customer_id\":\"STU0007\",\"uid\":11,\"ts\":1789134531312,\"full_name\":\"Dianah Ingabire\",\"role\":\"STUDENT\",\"email\":\"dianah@hopehaven.edu\",\"phone\":\"0788777777\",\"card_number\":\"HH-STU0007-MTX0I7LC\"},\"sig\":\"73cbe5fdea0961fb6c62fcf60e42ff1e0f2495abd31f7003532b729384f82b2e\"}', '2026-09-11 13:48:51', NULL, 'ACTIVE'),
(28, 13, 'HH-TCH0002-MTX0IAAT', '/uploads/qrcards/TCH0002_1789134534821.png', '{\"data\":{\"customer_id\":\"TCH0002\",\"uid\":13,\"ts\":1789134534821,\"full_name\":\"Clementine Uwamahoro\",\"role\":\"TEACHER\",\"email\":\"clementine@hopehaven.edu\",\"phone\":\"0788999999\",\"card_number\":\"HH-TCH0002-MTX0IAAT\"},\"sig\":\"4ab7112602bcaccb838d2a94608c4bef76017f6ff5ebad73a95fdcb8cad3fd68\"}', '2026-09-11 13:48:54', NULL, 'ACTIVE'),
(29, 12, 'HH-STU0008-MTX0IDXN', '/uploads/qrcards/STU0008_1789134539531.png', '{\"data\":{\"customer_id\":\"STU0008\",\"uid\":12,\"ts\":1789134539531,\"full_name\":\"Samuel Nkurunziza\",\"role\":\"STUDENT\",\"email\":\"samuel@hopehaven.edu\",\"phone\":\"0788888888\",\"card_number\":\"HH-STU0008-MTX0IDXN\"},\"sig\":\"051b8948013419556ee07917bfd0ea4a063c5927ca6fad3f292cf96c6e410094\"}', '2026-09-11 13:48:59', NULL, 'ACTIVE'),
(30, 16, 'HH-GST0001-MTX0IHTL', '/uploads/qrcards/GST0001_1789134544570.png', '{\"data\":{\"customer_id\":\"GST0001\",\"uid\":16,\"ts\":1789134544570,\"full_name\":\"Jean Bosco\",\"role\":\"GUEST\",\"email\":\"jean@hopehaven.edu\",\"phone\":\"0790333333\",\"card_number\":\"HH-GST0001-MTX0IHTL\"},\"sig\":\"286a3fc0f41a7d7ac0e52afc0ddaca22e990402a31c5a10a767fa3ca3208ad53\"}', '2026-09-11 13:49:04', NULL, 'ACTIVE'),
(31, 14, 'HH-TCH0003-MTX0IMG4', '/uploads/qrcards/TCH0003_1789134550564.png', '{\"data\":{\"customer_id\":\"TCH0003\",\"uid\":14,\"ts\":1789134550564,\"full_name\":\"Emmanuel Ndayisenga\",\"role\":\"TEACHER\",\"email\":\"emmanuel@hopehaven.edu\",\"phone\":\"0790111111\",\"card_number\":\"HH-TCH0003-MTX0IMG4\"},\"sig\":\"79547a3819b7fcbff109812fb77813e8db547593134140c15807a9629e87673a\"}', '2026-09-11 13:49:10', NULL, 'ACTIVE'),
(32, 15, 'HH-TCH0004-MTX0IQKS', '/uploads/qrcards/TCH0004_1789134555916.png', '{\"data\":{\"customer_id\":\"TCH0004\",\"uid\":15,\"ts\":1789134555916,\"full_name\":\"Beatrice Mukamana\",\"role\":\"TEACHER\",\"email\":\"beatrice@hopehaven.edu\",\"phone\":\"0790222222\",\"card_number\":\"HH-TCH0004-MTX0IQKS\"},\"sig\":\"840d9246403bc42f06baf56ee984e1947a776ac14820717cee2902c09ff4d2df\"}', '2026-09-11 13:49:16', NULL, 'ACTIVE');

-- --------------------------------------------------------

--
-- Table structure for table `ebooks`
--

CREATE TABLE `ebooks` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) DEFAULT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `grade_level` varchar(50) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `format` varchar(10) DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ebooks`
--

INSERT INTO `ebooks` (`id`, `title`, `author`, `subject`, `grade_level`, `file_path`, `file_size`, `format`, `cover_image`, `uploaded_by`, `status`, `created_at`) VALUES
(8, 'Biology', 'nesa', 'Biology', '1', '1789050632756_650694fb-65de-476f-b881-cfa6270fc158.pdf', 56987988, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:30:33'),
(9, 'Maths', 'nesa', 'Maths', '1', '1789051014390_4961111f-bf4e-4a59-958d-d66dcf5c70a0.pdf', 3947131, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:36:54'),
(10, 'History', 'nesa', 'History', '1', '1789051087698_c3fffa68-b490-4157-ab0b-94688237a23b.pdf', 14991649, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:38:07'),
(11, 'Entrepreneurships', 'nesa', 'Entrepreneurships', '1', '1789051168371_70a33517-669a-40c9-9254-2a33c076f9b6.pdf', 65234712, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:39:29'),
(12, 'Physics ', 'nesa', 'Physics ', '1', '1789051254881_d02a745d-14d5-40be-a1b1-745e3b655134.pdf', 16502874, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:40:55'),
(13, 'ICT', 'nesa', 'ICT', '1', '1789051295247_f94f108d-eb3b-46c0-9bf8-475468f422d7.pdf', 28779744, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:41:35'),
(14, 'French', 'nesa', 'French', '1', '1789051344223_f41beb2b-5bcd-451b-85a1-69f270abfd99.pdf', 7304636, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:42:24'),
(15, 'English', 'nesa', 'English', '1', '1789051388777_f5682652-fe9e-4b9a-a610-324980fd4766.pdf', 10349602, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:43:08'),
(16, 'Kinyarwanda', 'nesa', 'Kinyarwanda', '1', '1789051443127_6d61a235-32bb-4f1f-93e0-4b036e8ed5df.pdf', 18329358, 'PDF', NULL, 1, 'ACTIVE', '2026-09-10 14:44:03');

-- --------------------------------------------------------

--
-- Table structure for table `fines`
--

CREATE TABLE `fines` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `borrowing_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `days_overdue` int(11) DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'UNPAID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `fine_id`, `amount`, `method`, `reference`, `status`, `paid_at`, `recorded_by`) VALUES
(1, 8, NULL, 1500.00, 'MOBILE_MONEY', 'RCPT-2026-0041', 'COMPLETED', '2026-09-08 14:04:47', 1);

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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'STUDENT',
  `role_id` int(11) DEFAULT NULL,
  `customer_id` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `blocked_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `profile_image`, `password`, `role`, `role_id`, `customer_id`, `status`, `blocked_reason`, `created_at`, `updated_at`) VALUES
(1, 'System', 'Administrator', 'librarian@hopehaven.edu', '0788000000', '/uploads/profiles/profile_1_1789108060410.png', '$2a$10$mg/xxe.UQfjqEhhw.VcnH.tb4zlz.JBFQAyCudD10FoALU0vVAheS', 'LIBRARIAN', NULL, 'LIB0001', 'ACTIVE', NULL, '2026-09-09 08:23:20', '2026-09-11 06:27:40'),
(4, 'John', 'Doe', 'student@hopehaven.edu', '0788111111', NULL, '$2a$10$QaAOa9/8G0soimBL0.HnJOZKTFafbo7WiC6Js00of8SzM5NVwOw6O', 'STUDENT', NULL, 'STU0001', 'ACTIVE', NULL, '2026-09-09 16:47:48', '2026-09-09 16:47:48'),
(5, 'Jane', 'Smith', 'teacher@hopehaven.edu', '0788222222', NULL, '$2a$10$LeAOfo717.rQVOuieUzJUeyDb2O7xAGZH982IyJPYoeuPBLMjh.jm', 'TEACHER', NULL, 'TCH0001', 'ACTIVE', NULL, '2026-09-09 16:47:48', '2026-09-11 09:33:19'),
(6, 'mugabo', 'patrick', 'patrick@hopehaven.edu', '0788888888888', NULL, '$2a$10$PrJDb28/7TZPXFAYEejgLOoa5dqd1.a1u4kDD1a4h4JNy.Ur/RY/i', 'STUDENT', NULL, 'STU0002', 'ACTIVE', NULL, '2026-09-10 05:38:25', '2026-09-10 05:38:25'),
(7, 'Alice', 'Uwase', 'alice@hopehaven.edu', '0788333333', NULL, '$2a$10$kRehbcmrfKIjLFknGuZike6Sku/BhkHreGNYAy7qaaDEgPqrr/gnO', 'STUDENT', NULL, 'STU0003', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(8, 'Eric', 'Mugisha', 'eric@hopehaven.edu', '0788444444', NULL, '$2a$10$kRehbcmrfKIjLFknGuZike6Sku/BhkHreGNYAy7qaaDEgPqrr/gnO', 'STUDENT', NULL, 'STU0004', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(9, 'Grace', 'Niyonzima', 'grace@hopehaven.edu', '0788555555', NULL, '$2a$10$kRehbcmrfKIjLFknGuZike6Sku/BhkHreGNYAy7qaaDEgPqrr/gnO', 'STUDENT', NULL, 'STU0005', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-11 09:33:19'),
(10, 'Kevin', 'Habimana', 'kevin@hopehaven.edu', '0788666666', NULL, '$2a$10$kRehbcmrfKIjLFknGuZike6Sku/BhkHreGNYAy7qaaDEgPqrr/gnO', 'STUDENT', NULL, 'STU0006', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-11 09:33:19'),
(11, 'Dianah', 'Ingabire', 'dianah@hopehaven.edu', '0788777777', NULL, '$2a$10$kRehbcmrfKIjLFknGuZike6Sku/BhkHreGNYAy7qaaDEgPqrr/gnO', 'STUDENT', NULL, 'STU0007', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(12, 'Samuel', 'Nkurunziza', 'samuel@hopehaven.edu', '0788888888', NULL, '$2a$10$kRehbcmrfKIjLFknGuZike6Sku/BhkHreGNYAy7qaaDEgPqrr/gnO', 'STUDENT', NULL, 'STU0008', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(13, 'Clementine', 'Uwamahoro', 'clementine@hopehaven.edu', '0788999999', NULL, '$2a$10$qadtPXDgJcJAMoewMW/bMOYicgOuVq.7foz1ELblEPg/B3haA9Uyi', 'TEACHER', NULL, 'TCH0002', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(14, 'Emmanuel', 'Ndayisenga', 'emmanuel@hopehaven.edu', '0790111111', NULL, '$2a$10$qadtPXDgJcJAMoewMW/bMOYicgOuVq.7foz1ELblEPg/B3haA9Uyi', 'TEACHER', NULL, 'TCH0003', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(15, 'Beatrice', 'Mukamana', 'beatrice@hopehaven.edu', '0790222222', NULL, '$2a$10$qadtPXDgJcJAMoewMW/bMOYicgOuVq.7foz1ELblEPg/B3haA9Uyi', 'TEACHER', NULL, 'TCH0004', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(16, 'Jean', 'Bosco', 'jean@hopehaven.edu', '0790333333', NULL, '$2a$10$ech9jf4ICpBteKRKlyTSbOg9Gs9M7BdJut.YQeHQD.jJZ1XDqf9Ny', 'GUEST', NULL, 'GST0001', 'ACTIVE', NULL, '2026-09-10 12:04:46', '2026-09-10 12:04:46'),
(17, 'Aimee', 'Umutoni', 'aimee@hopehaven.edu', '0790444444', NULL, '$2a$10$ech9jf4ICpBteKRKlyTSbOg9Gs9M7BdJut.YQeHQD.jJZ1XDqf9Ny', 'GUEST', NULL, 'GST0002', 'ACTIVE', NULL, '2026-09-10 12:04:47', '2026-09-10 12:04:47');

--
-- Indexes for dumped tables
--

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
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `copy_id` (`copy_id`);

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
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=242;

--
-- AUTO_INCREMENT for table `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `book_copies`
--
ALTER TABLE `book_copies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `customer_cards`
--
ALTER TABLE `customer_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `ebooks`
--
ALTER TABLE `ebooks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `fines`
--
ALTER TABLE `fines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `retired_books`
--
ALTER TABLE `retired_books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
('root', '[{\"db\":\"hope_haven_library\",\"table\":\"retired_books\"},{\"db\":\"hope_haven_library\",\"table\":\"fines\"},{\"db\":\"hope_haven_library\",\"table\":\"customer_cards\"},{\"db\":\"hope_haven_library\",\"table\":\"bookmarks\"},{\"db\":\"hope_haven_library\",\"table\":\"ebooks\"},{\"db\":\"hope_haven_library\",\"table\":\"books\"},{\"db\":\"hope_haven_library\",\"table\":\"book_copies\"},{\"db\":\"hope_haven_library\",\"table\":\"users\"},{\"db\":\"hope_haven_library\",\"table\":\"borrowings\"},{\"db\":\"hope_haven_library\",\"table\":\"payments\"}]');

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
('root', '2026-09-11 15:18:37', '{\"Console\\/Mode\":\"collapse\"}');

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
