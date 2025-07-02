const { PrismaClient, ServiceType } = require('@prisma/client')
const prisma = new PrismaClient()

// Enum validation function
const isValidServiceType = (type) => Object.values(ServiceType).includes(type)

exports.createService = async (req, res) => {
    try {
        // Validate required fields
        const { m04_model, m04_imei, m04_service_type, m04_service_cost, m04_service_charge, m04_date, m04_warrenty, m04_m01_user_id } = req.body
        if (!m04_model) {
            return res.status(422).json({ error: "Model is required" })
        }
        // if (!m04_date) { // Commented out as per your removal
        //     return res.status(422).json({ error: "Service date is required" })
        // }

        // Validate enum field
        if (m04_service_type && !isValidServiceType(m04_service_type)) {
            return res.status(422).json({ error: `Invalid service type. Must be one of ${Object.values(ServiceType).join(', ')}` })
        }

        // Parse and validate date
        let serviceDate = null
        if (m04_date) {
            const date = new Date(m04_date)
            if (isNaN(date.getTime())) {
                return res.status(422).json({ error: "Invalid date format. Use YYYY-MM-DD" })
            }
            serviceDate = date.toISOString()
        }

        // Validate user ID if provided
        let userId = null
        if (m04_m01_user_id !== undefined && m04_m01_user_id !== null) {
            userId = parseInt(m04_m01_user_id)
            if (isNaN(userId)) {
                return res.status(422).json({ error: "User ID must be a valid number" })
            }
        }

        // Create service
        const service = await prisma.m04_service.create({
            data: {
                m04_model,
                m04_imei: m04_imei || null,
                m04_service_type: m04_service_type || null,
                m04_service_cost: m04_service_cost || null,
                m04_service_charge: m04_service_charge || null,
                m04_completed: req.body.m04_completed || false,
                m04_date: serviceDate,
                m04_warrenty: m04_warrenty || null,
                m04_m01_user_id: userId // Will be null if not provided
            }
        })

        return res.status(201).json({
            status: "Success",
            message: "Service Created Successfully",
            data: service
        })
    } catch (error) {
        console.error('Error during service creation:', error)
        return res.status(500).json({ error: error.message || 'An error occurred while creating the service' })
    }
}

exports.getAllServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const skip = (pageNum - 1) * limitNum

        const searchFilter = search ? {
            OR: [
                { m04_model: { contains: search, mode: 'insensitive' } },
                { m04_imei: { contains: search, mode: 'insensitive' } },
                { m04_service_type: { contains: search, mode: 'insensitive' } },
                { m04_service_cost: { contains: search, mode: 'insensitive' } },
                { m04_service_charge: { contains: search, mode: 'insensitive' } },
                { m04_warrenty: { contains: search, mode: 'insensitive' } }
            ].filter(condition => condition !== undefined)
        } : {}

        const [services, totalCount] = await Promise.all([
            prisma.m04_service.findMany({
                where: searchFilter,
                skip: skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.m04_service.count({ where: searchFilter })
        ])

        return res.status(200).json({
            status: "Success",
            message: "Services Fetched Successfully",
            data: {
                services,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            }
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.getSingleService = async (req, res) => {
    try {
        const m04_id = parseInt(req.params.m04_id)
        if (isNaN(m04_id)) {
            return res.status(400).json({ error: "Invalid Service ID format" })
        }

        const service = await prisma.m04_service.findUnique({ where: { m04_id } })
        if (!service) {
            return res.status(404).json({ error: 'Service not found!' })
        }

        return res.status(200).json({
            status: "Success",
            message: "Service Fetched Successfully",
            data: service
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.updateService = async (req, res) => {
    try {
        const m04_id = parseInt(req.params.m04_id)
        if (isNaN(m04_id)) {
            return res.status(400).json({ error: "Invalid Service ID format" })
        }

        // Check if service exists
        const existingService = await prisma.m04_service.findUnique({ where: { m04_id } })
        if (!existingService) {
            return res.status(404).json({ error: 'Service not found!' })
        }

        // Validate required fields
        const { m04_model, m04_imei, m04_service_type, m04_service_cost, m04_service_charge, m04_date, m04_warrenty, m04_m01_user_id } = req.body
        if (!m04_model) {
            return res.status(422).json({ error: "Model is required" })
        }

        // Validate enum field
        if (m04_service_type && !isValidServiceType(m04_service_type)) {
            return res.status(422).json({ error: `Invalid service type. Must be one of ${Object.values(ServiceType).join(', ')}` })
        }

        // Parse and validate date if provided
        let serviceDate = undefined
        if (m04_date !== undefined && m04_date !== null) {
            const date = new Date(m04_date)
            if (isNaN(date.getTime())) {
                return res.status(422).json({ error: "Invalid date format. Use YYYY-MM-DD" })
            }
            serviceDate = date.toISOString()
        }

        // Validate user ID if provided
        let userId = undefined
        if (m04_m01_user_id !== undefined && m04_m01_user_id !== null) {
            userId = parseInt(m04_m01_user_id)
            if (isNaN(userId)) {
                return res.status(422).json({ error: "User ID must be a valid number" })
            }
        }

        // Prepare data for update
        const serviceData = {
            m04_model,
            m04_imei: m04_imei || undefined,
            m04_service_type: m04_service_type || undefined,
            m04_service_cost: m04_service_cost || undefined,
            m04_service_charge: m04_service_charge || undefined,
            m04_completed: req.body.m04_completed || undefined,
            m04_date: serviceDate,
            m04_warrenty: m04_warrenty || undefined,
            m04_m01_user_id: userId
        }

        // Update service
        const updatedService = await prisma.m04_service.update({
            where: { m04_id },
            data: Object.fromEntries(
                Object.entries(serviceData).filter(([_, value]) => value !== undefined)
            )
        })

        return res.status(200).json({
            status: "Success",
            message: "Service Updated Successfully",
            data: updatedService
        })
    } catch (error) {
        console.error('Error during service update:', error)
        return res.status(500).json({ error: error.message || 'An error occurred while updating the service' })
    }
}

exports.deleteService = async (req, res) => {
    try {
        const m04_id = parseInt(req.params.m04_id)
        if (isNaN(m04_id)) {
            return res.status(400).json({ error: "Invalid Service ID format" })
        }

        const service = await prisma.m04_service.findUnique({ where: { m04_id } })
        if (!service) {
            return res.status(404).json({ error: 'Service not found!' })
        }

        await prisma.m04_service.delete({
            where: { m04_id }
        })

        return res.status(204).send()
    } catch (error) {
        console.error('Error during service deletion:', error)
        return res.status(500).json({ error: error.message || 'An error occurred while deleting the service' })
    }
}