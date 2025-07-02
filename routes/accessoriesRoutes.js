const router = require('express').Router()
const accessoriesContrroller = require('../controllers/accessoriesControllers')

router.post('/', accessoriesContrroller.createAccessory)
router.get('/', accessoriesContrroller.getAccessories)
router.get('/:m03_id', accessoriesContrroller.getSingleAccessory)
router.delete('/:m03_id', accessoriesContrroller.deleteAccessory)
router.put('/:m03_id', accessoriesContrroller.updateAccessory)

module.exports = router