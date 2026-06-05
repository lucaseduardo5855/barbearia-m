"use server";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";

export const getConcluedBookings = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return [];
  }
  return db.booking.findMany({
    where: {
      userId: (session?.user as any).id,
      date: {
        lt: new Date(),
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
