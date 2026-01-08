import { Router } from 'express';
import { getTeams, getTeam, createNewTeam, updateTeam, deleteTeamById } from './team.controller';
const router = Router();
// Get all teams with members
router.get('/', (req, res) => {
    return getTeams(req, res);
});
// Get a specific team by ID
router.get('/:id', (req, res) => {
    return getTeam(req, res);
});
// Create a new team
router.post('/', (req, res) => {
    return createNewTeam(req, res);
});
// Update team members
router.put('/:id/members', (req, res) => {
    return updateTeam(req, res);
});
// Delete team
router.delete('/:id', (req, res) => {
    return deleteTeamById(req, res);
});
export default router;
