"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import { db } from "@/lib/prisma";

//Vai retornar para mim os agendamentos confirmados
export const getConfirmedBookings = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return [];
  }
  return await db.booking.findMany({
    where: {
      userId: (session.user as any).id,
      date: {
        gte: new Date(),
      },
    },
    include: {
      service: {
        include: {
          barbershop: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });
};
