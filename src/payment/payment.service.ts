/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayment, UpdatePayment, } from './dto/payment.dto';
import { payment } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(createPaymentDto: CreatePayment) {
    const { outlet_id, payment_name, payment_type } = createPaymentDto;

    const payment = await this.prisma.payment.create({
      data: {
        outlet_id: outlet_id || null, 
        payment_name,
        payment_type,
      },
    });

    return payment;
  }


  async getAllPayments(page: number, limit: number) {
    const maxLimit = 10;
    const normalLimit = Math.min(limit, maxLimit)
    const skip = (page - 1) * normalLimit;
    const [payments, totalCount] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: {
          deleted_at: null,
        },
        skip: skip,
        take: normalLimit,
      }),
      this.prisma.payment.count({
        where: {
          deleted_at: null,
        },
      }),
    ]);

    return {
      data: payments,
      meta: {
        currentPage: page,
        itemsPerPage: normalLimit,
        totalPages: Math.ceil(totalCount / normalLimit ),
        totalItems: totalCount,
      },
    };
  }

  async getPaymentById(payment_id: number): Promise<payment> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        payment_id: payment_id,
        deleted_at: null,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${payment_id} not found or has been deleted.`);
    }

    return payment;
  }

  async updatePayment(payment_id: number, data: UpdatePayment) {
    return this.prisma.payment.update({
      where: { payment_id },
      data: {
        outlet_id: data.outlet_id,
        payment_name: data.payment_name,
        payment_type: data.payment_type,
      },
    });
  }

  async softDeletePayment(payment_id: number): Promise<payment> {
    return this.prisma.payment.update({
      where: {
        payment_id: payment_id,
      },
      data: {
        deleted_at: new Date()
      }
    });
  }
}