import { Request, Response, NextFunction } from 'express'

/**
 * GET /ping
 * Returns a pong if server is up
 */
export let ping = (req: Request, res: Response) => {
  res.status(200).send('We have a signal!')
}
