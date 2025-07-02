const router = require('express').Router()
const mobileController = require('../controllers/mobilesControllers')

router.post('/', mobileController.createMobile)
router.get('/', mobileController.listMobiles)
router.get('/:m02_id', mobileController.getSingleMobile)
router.delete('/:m02_id', mobileController.deleteMobile)
router.put('/:m02_id', mobileController.updateMobile)

module.exports =  router