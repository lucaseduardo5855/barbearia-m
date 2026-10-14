// Stable entry point. Implementations are grouped by business responsibility.
export {
  addServiceAction,
  deleteServiceAction,
  addBarberAction,
  deleteBarberAction,
  updateBarbershopConfig,
  updateBarberCommissionRateAction,
  quickSetupBarbershopAction,
} from "./admin/catalog"
export {
  updateBookingStatusAction,
  createAdminBookingAction,
  updateBookingDetailsAction,
  createBlockedTimeAction,
  deleteBlockedTimeAction,
} from "./admin/bookings"
export {
  addBookingProductAction,
  addProductAction,
  updateProductAction,
  deleteProductAction,
  createProductSaleAction,
} from "./admin/inventory"
export {
  createFinancialTransactionAction,
  payBarberCommissionsAction,
} from "./admin/finance"
