import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class UniqueOrderValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;

    // Si estamos validando los módulos
    if (relatedPropertyName === 'modules') {
      const moduleOrders = value.map((module: any) => module.order);
      return new Set(moduleOrders).size === moduleOrders.length; // Verificamos duplicados en módulos
    }

    // Si estamos validando las lecciones
    if (relatedPropertyName === 'lessons') {
      const lessonOrders = value.map((lesson: any) => lesson.order);
      return new Set(lessonOrders).size === lessonOrders.length; // Verificamos duplicados en lecciones
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Los 'order' dentro de ${args.property} no pueden repetirse.`;
  }
}
