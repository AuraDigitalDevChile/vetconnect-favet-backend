/**
 * TELEMEDICINA CONTROLLER
 *
 * Maneja las sesiones de teleconsulta:
 * - Crear sesiones y generar enlaces únicos con JWT
 * - Iniciar y finalizar sesiones
 * - Registrar diagnósticos, recetas y exámenes
 * - Vincular con facturación
 * - Enviar enlaces por email/WhatsApp
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { ApiResponseUtil } from '../utils/api-response.util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const createSesionSchema = z.object({
  cita_id: z.number().int().positive(),
  duracion_horas: z.number().min(1).max(24).optional().default(24), // Expiración del link
});

const endSesionSchema = z.object({
  notas_sesion: z.string().optional(),
  diagnostico: z.string().optional(),
});

const sendLinkSchema = z.object({
  metodo: z.enum(['email', 'whatsapp', 'ambos']),
  mensaje_personalizado: z.string().optional(),
});

// ============================================
// HELPER: Generar nombre de sala único
// ============================================

function generateRoomName(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `vetconnect-${timestamp}-${random}`;
}

// ============================================
// HELPER: Generar token JWT para la sesión
// ============================================

function generateSessionToken(
  sesionId: number,
  citaId: number,
  roomName: string,
  expiresIn: Date
): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

  return jwt.sign(
    {
      sesion_id: sesionId,
      cita_id: citaId,
      room_name: roomName,
      type: 'telemedicina',
    },
    JWT_SECRET,
    {
      expiresIn: Math.floor((expiresIn.getTime() - Date.now()) / 1000), // Segundos hasta expiración
    }
  );
}

// ============================================
// POST /api/telemedicina/create
// Crear sesión de telemedicina y generar enlaces
// ============================================

export async function crearSesion(req: Request, res: Response) {
  try {
    const validatedData = createSesionSchema.parse(req.body);

    // 1. Verificar que la cita existe y es de tipo TELEMEDICINA
    const cita = await prisma.cita.findUnique({
      where: { id: validatedData.cita_id },
      include: {
        paciente: {
          include: {
            tutor: true,
          },
        },
        veterinario: true,
        centro: true,
      },
    });

    if (!cita) {
      return ApiResponseUtil.error(res, 404, 'Cita no encontrada');
    }

    if (cita.tipo !== 'TELEMEDICINA') {
      return ApiResponseUtil.error(
        res,
        400,
        'La cita no es de tipo Telemedicina'
      );
    }

    // 2. Verificar que no existe ya una sesión para esta cita
    const sesionExistente = await prisma.sesionTelemedicina.findUnique({
      where: { cita_id: validatedData.cita_id },
    });

    if (sesionExistente) {
      return ApiResponseUtil.error(
        res,
        400,
        'Ya existe una sesión de telemedicina para esta cita',
        { sesion_id: sesionExistente.id }
      );
    }

    // 3. Generar datos de la sala
    const roomName = generateRoomName();
    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + validatedData.duracion_horas);

    // 4. Crear sesión (sin token aún, lo generaremos después de tener el ID)
    const sesion = await prisma.sesionTelemedicina.create({
      data: {
        cita_id: validatedData.cita_id,
        room_name: roomName,
        token_sala: 'temporal', // Se actualizará después
        url_veterinario: 'temporal',
        url_tutor: 'temporal',
        expira_en: expiraEn,
        estado: 'PROGRAMADA',
      },
    });

    // 5. Generar token JWT con el ID de la sesión
    const token = generateSessionToken(
      sesion.id,
      validatedData.cita_id,
      roomName,
      expiraEn
    );

    // 6. Generar URLs
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
    const urlVeterinario = `${FRONTEND_URL}/telemedicina/sala/${roomName}?token=${token}&role=veterinario`;
    const urlTutor = `${FRONTEND_URL}/telemedicina/sala/${roomName}?token=${token}&role=tutor`;

    // 7. Actualizar sesión con token y URLs
    const sesionActualizada = await prisma.sesionTelemedicina.update({
      where: { id: sesion.id },
      data: {
        token_sala: token,
        url_veterinario: urlVeterinario,
        url_tutor: urlTutor,
      },
      include: {
        cita: {
          include: {
            paciente: {
              include: {
                tutor: true,
              },
            },
            veterinario: true,
          },
        },
      },
    });

    return ApiResponseUtil.success(
      res,
      201,
      'Sesión de telemedicina creada exitosamente',
      sesionActualizada
    );
  } catch (error: any) {
    console.error('Error en TelemedicinaCont roller.crearSesion:', error);

    if (error instanceof z.ZodError) {
      return ApiResponseUtil.error(
        res,
        400,
        'Datos de entrada inválidos',
        error.errors
      );
    }

    return ApiResponseUtil.error(
      res,
      500,
      'Error al crear sesión de telemedicina',
      error.message
    );
  }
}

// ============================================
// GET /api/telemedicina/:id
// Obtener detalles de una sesión
// ============================================

export async function obtenerSesion(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sesion = await prisma.sesionTelemedicina.findUnique({
      where: { id: parseInt(id) },
      include: {
        cita: {
          include: {
            paciente: {
              include: {
                tutor: true,
                // registros_peso: {
                //   orderBy: { fecha: 'desc' },
                //   take: 5,
                // },
                vacunas: {
                  orderBy: { fecha_aplicacion: 'desc' },
                  take: 10,
                },
              },
            },
            veterinario: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
                rol: true,
              },
            },
            ficha_clinica: {
              include: {
                examenes: true,
                recetas: true,
              },
            },
          },
        },
      },
    });

    if (!sesion) {
      return ApiResponseUtil.error(res, 404, 'Sesión no encontrada');
    }

    return ApiResponseUtil.success(
      res,
      200,
      'Sesión obtenida exitosamente',
      sesion
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.obtenerSesion:', error);
    return ApiResponseUtil.error(
      res,
      500,
      'Error al obtener sesión',
      error.message
    );
  }
}

// ============================================
// GET /api/telemedicina/room/:roomName
// Obtener sesión por nombre de sala (para el frontend)
// ============================================

export async function obtenerSesionPorSala(req: Request, res: Response) {
  try {
    const { roomName } = req.params;

    const sesion = await prisma.sesionTelemedicina.findUnique({
      where: { room_name: roomName },
      include: {
        cita: {
          include: {
            paciente: {
              include: {
                tutor: true,
              },
            },
            veterinario: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
                rol: true,
              },
            },
          },
        },
      },
    });

    if (!sesion) {
      return ApiResponseUtil.error(res, 404, 'Sala no encontrada');
    }

    // Verificar si la sesión expiró
    if (new Date() > sesion.expira_en) {
      await prisma.sesionTelemedicina.update({
        where: { id: sesion.id },
        data: { estado: 'EXPIRADA' },
      });

      return ApiResponseUtil.error(res, 410, 'La sesión ha expirado');
    }

    return ApiResponseUtil.success(
      res,
      200,
      'Sesión obtenida exitosamente',
      sesion
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.obtenerSesionPorSala:', error);
    return ApiResponseUtil.error(
      res,
      500,
      'Error al obtener sesión',
      error.message
    );
  }
}

// ============================================
// PUT /api/telemedicina/:id/start
// Iniciar sesión (cuando alguien entra a la sala)
// ============================================

export async function iniciarSesion(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sesion = await prisma.sesionTelemedicina.findUnique({
      where: { id: parseInt(id) },
    });

    if (!sesion) {
      return ApiResponseUtil.error(res, 404, 'Sesión no encontrada');
    }

    if (sesion.estado === 'EN_CURSO') {
      return ApiResponseUtil.success(res, 200, 'Sesión ya está en curso', sesion);
    }

    if (sesion.estado === 'FINALIZADA' || sesion.estado === 'EXPIRADA') {
      return ApiResponseUtil.error(
        res,
        400,
        `No se puede iniciar una sesión ${sesion.estado.toLowerCase()}`
      );
    }

    const sesionActualizada = await prisma.sesionTelemedicina.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'EN_CURSO',
        fecha_inicio: new Date(),
      },
    });

    return ApiResponseUtil.success(
      res,
      200,
      'Sesión iniciada exitosamente',
      sesionActualizada
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.iniciarSesion:', error);
    return ApiResponseUtil.error(
      res,
      500,
      'Error al iniciar sesión',
      error.message
    );
  }
}

// ============================================
// PUT /api/telemedicina/:id/end
// Finalizar sesión y registrar datos
// ============================================

export async function finalizarSesion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = endSesionSchema.parse(req.body);

    const sesion = await prisma.sesionTelemedicina.findUnique({
      where: { id: parseInt(id) },
    });

    if (!sesion) {
      return ApiResponseUtil.error(res, 404, 'Sesión no encontrada');
    }

    if (sesion.estado === 'FINALIZADA') {
      return ApiResponseUtil.error(res, 400, 'La sesión ya fue finalizada');
    }

    // Calcular duración
    let duracionMinutos = null;
    if (sesion.fecha_inicio) {
      const fechaFin = new Date();
      duracionMinutos = Math.floor(
        (fechaFin.getTime() - sesion.fecha_inicio.getTime()) / (1000 * 60)
      );
    }

    const sesionActualizada = await prisma.sesionTelemedicina.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'FINALIZADA',
        fecha_fin: new Date(),
        duracion_minutos: duracionMinutos,
        notas_sesion: validatedData.notas_sesion,
        diagnostico: validatedData.diagnostico,
      },
      include: {
        cita: {
          include: {
            paciente: true,
            veterinario: true,
          },
        },
      },
    });

    // Actualizar estado de la cita
    await prisma.cita.update({
      where: { id: sesion.cita_id },
      data: { estado: 'COMPLETADA' },
    });

    return ApiResponseUtil.success(
      res,
      200,
      'Sesión finalizada exitosamente',
      sesionActualizada
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.finalizarSesion:', error);

    if (error instanceof z.ZodError) {
      return ApiResponseUtil.error(
        res,
        400,
        'Datos de entrada inválidos',
        error.errors
      );
    }

    return ApiResponseUtil.error(
      res,
      500,
      'Error al finalizar sesión',
      error.message
    );
  }
}

// ============================================
// POST /api/telemedicina/:id/sendLink
// Enviar enlace por email o WhatsApp
// ============================================

export async function enviarEnlace(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = sendLinkSchema.parse(req.body);

    const sesion = await prisma.sesionTelemedicina.findUnique({
      where: { id: parseInt(id) },
      include: {
        cita: {
          include: {
            paciente: {
              include: {
                tutor: true,
              },
            },
            veterinario: true,
          },
        },
      },
    });

    if (!sesion) {
      return ApiResponseUtil.error(res, 404, 'Sesión no encontrada');
    }

    const tutor = sesion.cita.paciente.tutor;
    const paciente = sesion.cita.paciente;
    const veterinario = sesion.cita.veterinario;

    // Mensaje personalizado o default
    const mensajeBase =
      validatedData.mensaje_personalizado ||
      `Hola ${tutor.nombre_completo},\n\nTiene una consulta de telemedicina programada para ${paciente.nombre}.\n\nVeterinario: ${veterinario.nombre_completo}\n\nEnlace de acceso:\n${sesion.url_tutor}\n\nEste enlace expira el ${sesion.expira_en.toLocaleString('es-CL')}\n\n¡Gracias por confiar en nosotros!`;

    // TODO: Aquí integrarías con servicios reales de email/WhatsApp
    // Por ahora solo simulamos el envío
    let resultado: any = {
      email: null,
      whatsapp: null,
    };

    if (validatedData.metodo === 'email' || validatedData.metodo === 'ambos') {
      // Simular envío de email
      resultado.email = {
        destinatario: tutor.email,
        asunto: `Consulta de Telemedicina - ${paciente.nombre}`,
        mensaje: mensajeBase,
        enviado: true,
        fecha: new Date(),
      };
      console.log('[EMAIL] Simulated send to:', tutor.email);
    }

    if (validatedData.metodo === 'whatsapp' || validatedData.metodo === 'ambos') {
      // Simular envío de WhatsApp
      resultado.whatsapp = {
        destinatario: tutor.telefono,
        mensaje: mensajeBase,
        enviado: true,
        fecha: new Date(),
      };
      console.log('[WHATSAPP] Simulated send to:', tutor.telefono);
    }

    // Actualizar sesión
    await prisma.sesionTelemedicina.update({
      where: { id: parseInt(id) },
      data: {
        link_enviado: true,
        fecha_envio_link: new Date(),
      },
    });

    return ApiResponseUtil.success(
      res,
      200,
      'Enlace enviado exitosamente',
      resultado
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.enviarEnlace:', error);

    if (error instanceof z.ZodError) {
      return ApiResponseUtil.error(
        res,
        400,
        'Datos de entrada inválidos',
        error.errors
      );
    }

    return ApiResponseUtil.error(
      res,
      500,
      'Error al enviar enlace',
      error.message
    );
  }
}

// ============================================
// GET /api/telemedicina/lista
// Listar sesiones (con filtros)
// ============================================

export async function listarSesiones(req: Request, res: Response) {
  try {
    const { estado, fecha_desde, fecha_hasta, veterinario_id, paciente_id } =
      req.query;

    // Construir filtros
    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (fecha_desde || fecha_hasta) {
      where.created_at = {};
      if (fecha_desde) {
        where.created_at.gte = new Date(fecha_desde as string);
      }
      if (fecha_hasta) {
        where.created_at.lte = new Date(fecha_hasta as string);
      }
    }

    if (veterinario_id) {
      where.cita = {
        veterinario_id: parseInt(veterinario_id as string),
      };
    }

    if (paciente_id) {
      where.cita = {
        ...where.cita,
        paciente_id: parseInt(paciente_id as string),
      };
    }

    const sesiones = await prisma.sesionTelemedicina.findMany({
      where,
      include: {
        cita: {
          include: {
            paciente: {
              include: {
                tutor: {
                  select: {
                    id: true,
                    nombre_completo: true,
                    email: true,
                    telefono: true,
                  },
                },
              },
            },
            veterinario: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return ApiResponseUtil.success(
      res,
      200,
      'Sesiones obtenidas exitosamente',
      sesiones
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.listarSesiones:', error);
    return ApiResponseUtil.error(
      res,
      500,
      'Error al listar sesiones',
      error.message
    );
  }
}

// ============================================
// PUT /api/telemedicina/:id/receta
// Incrementar contador de recetas
// ============================================

export async function registrarReceta(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sesion = await prisma.sesionTelemedicina.update({
      where: { id: parseInt(id) },
      data: {
        recetas_generadas: {
          increment: 1,
        },
      },
    });

    return ApiResponseUtil.success(
      res,
      200,
      'Receta registrada en sesión',
      sesion
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.registrarReceta:', error);
    return ApiResponseUtil.error(
      res,
      500,
      'Error al registrar receta',
      error.message
    );
  }
}

// ============================================
// PUT /api/telemedicina/:id/examen
// Incrementar contador de exámenes
// ============================================

export async function registrarExamen(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const sesion = await prisma.sesionTelemedicina.update({
      where: { id: parseInt(id) },
      data: {
        examenes_solicitados: {
          increment: 1,
        },
      },
    });

    return ApiResponseUtil.success(
      res,
      200,
      'Examen registrado en sesión',
      sesion
    );
  } catch (error: any) {
    console.error('Error en TelemedicinController.registrarExamen:', error);
    return ApiResponseUtil.error(
      res,
      500,
      'Error al registrar examen',
      error.message
    );
  }
}
