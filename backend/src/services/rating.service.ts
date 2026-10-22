import { ratingRepository } from "../repositories/rating.repository";
import { AppError } from "../utils/appError";

export const ratingService = {
  async submitRating(customerId: string, salonId: string, rating: number) {
    const salon = await ratingRepository.findSalon(salonId);

    if (!salon) {
      throw new AppError(404, "SALON_NOT_FOUND", "Salon not found");
    }

    const completedBooking = await ratingRepository.hasCompletedBooking(
      customerId,
      salonId,
    );

    if (!completedBooking) {
      throw new AppError(
        403,
        "RATING_NOT_ALLOWED",
        "You can rate a salon only after completing a booking there",
      );
    }

    return ratingRepository.upsertCustomerRating(customerId, salonId, rating);
  },

  async getMyRating(customerId: string, salonId: string) {
    const salon = await ratingRepository.findSalon(salonId);

    if (!salon) {
      throw new AppError(404, "SALON_NOT_FOUND", "Salon not found");
    }

    return ratingRepository.findCustomerRating(customerId, salonId);
  },
};
