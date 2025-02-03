import express from 'express'
import { HomeController } from '../controllers/homeController.js'

/**
 * Sets up route to home index file through controller.
 */
export const router = express.Router()

/**
 * Instance of HomeController to handle requests.
 */
const controller = new HomeController()

/**
 * Route for GET requests to the home page.
 * Handles requests by calling the index method of the HomeController.
 */
router.get('/', (req, res, next) => controller.index(req, res, next))
