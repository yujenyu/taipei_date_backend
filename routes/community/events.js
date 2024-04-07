import express from 'express'
import { community } from '../apiConfig.js'
import { getEvents } from '../../services/index.js'

const router = express.Router()

router.get(community.getEvents, async (_req, res) => {
    const results = await getEvents()
    res.json(results)
})

export default router
