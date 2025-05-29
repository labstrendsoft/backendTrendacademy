import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfirmPaymentDto, CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class PaymentService {
  private preference: Preference;

  constructor(private readonly prisma: PrismaService) {
    const mercadoPagoClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
    });

    this.preference = new Preference(mercadoPagoClient);
  }
  // Crear el pago (PENDING) y la preferencia de Mercado Pago
  // payment.service.ts
  async createPaymentForCourse(dto: CreatePaymentDto) {
    // 1. Obtener los cursos
    const courses = await this.prisma.course.findMany({
      where: { id: { in: dto.courseIds } },
    });

    if (courses.length !== dto.courseIds.length) {
      throw new NotFoundException('Uno o más cursos no fueron encontrados');
    }

    // 2. Verificar si ya está inscrito en alguno de los cursos
    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: {
        userId: dto.userId,
        courseId: { in: dto.courseIds },
      },
      select: { courseId: true },
    });

    if (existingEnrollments.length > 0) {
      const alreadyEnrolledIds = existingEnrollments.map((e) => e.courseId);
      const alreadyEnrolledTitles = courses
        .filter((course) => alreadyEnrolledIds.includes(course.id))
        .map((course) => course.title)
        .join(', ');

      throw new BadRequestException(
        `Ya estás inscrito en los siguientes cursos: ${alreadyEnrolledTitles}`,
      );
    }

    // 2. Calcular el monto total
    const totalAmount = courses.reduce((sum, course) => {
      return sum + Number(course.price);
    }, 0);

    // 3. Crear el pago
    const payment = await this.prisma.payment.create({
      data: {
        userId: dto.userId,
        amount: totalAmount,
        currency: 'PEN',
        status: PaymentStatus.PENDING,
      },
    });

    // 4. Crear los PaymentItem asociados a cada curso
    const paymentItemsData = courses.map((course) => ({
      paymentId: payment.id,
      courseId: course.id,
      amount: course.price,
    }));

    await this.prisma.paymentItem.createMany({
      data: paymentItemsData,
    });

    // 5. Crear preferencia de pago de MercadoPago
    try {
      const preference = await this.preference.create({
        body: {
          items: courses.map((course) => ({
            id: course.id,
            title: course.title,
            quantity: 1,
            unit_price: Number(course.price),
            currency_id: 'PEN',
          })),
          metadata: {
            userId: dto.userId,
            paymentId: payment.id,
            courseIds: dto.courseIds,
          },
          external_reference: payment.id,
          back_urls: {
            success: `${process.env.FRONTEND_URL}/carrito/exito`,
            failure: `${process.env.FRONTEND_URL}/carrito`,
            pending: `${process.env.FRONTEND_URL}/payments/pending`,
          },
          auto_return: 'approved',
        },
      });

      return {
        payment,
        init_point: preference.init_point,
      };
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      throw new BadRequestException({
        message: 'Error creando la preferencia de pago en MercadoPago',
        details: error.response ?? error.message ?? error,
      });
    }
  }

  // Confirmar el pago (PAID) y crear enrollment
  async confirmPayment(dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { items: true }, // incluir los cursos asociados
    });

    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status !== PaymentStatus.PENDING)
      throw new BadRequestException('Pago ya procesado');

    const updatedPayment = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status: PaymentStatus.PAID,
        externalChargeId: dto.externalChargeId,
      },
    });

    // Crear un enrollment por cada curso pagado
    const enrollmentData = payment.items.map((item) => ({
      userId: payment.userId,
      courseId: item.courseId,
    }));

    await this.prisma.enrollment.createMany({
      data: enrollmentData,
      skipDuplicates: true, // por si ya existe algún enrollment previo
    });

    return updatedPayment;
  }

  create(createPaymentDto: CreatePaymentDto) {
    return 'This action adds a new payment';
  }

  findAll() {
    return `This action returns all payment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
