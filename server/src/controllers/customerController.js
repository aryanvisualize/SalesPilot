
import Customer from "../models/Customer.js";

export async function createCustomer(req, res) {
  try {
    const { accountName, contactPerson, email, phone, address } = req.body;

    if (
      typeof accountName !== "string" ||
      !accountName.trim() ||
      typeof contactPerson !== "string" ||
      !contactPerson.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Account name and contact person are required",
      });
    }

    const customer = await Customer.create({
      accountName: accountName.trim(),
      contactPerson: contactPerson.trim(),
      email,
      phone,
      address,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create customer",
    });
  }
}

export async function listCustomers(req, res) {
  try {
    const customers = await Customer.find().sort({ accountName: 1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("List customers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers",
    });
  }
}
