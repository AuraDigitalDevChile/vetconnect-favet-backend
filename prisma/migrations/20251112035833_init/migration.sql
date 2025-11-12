-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'VETERINARIO', 'RECEPCIONISTA', 'ASISTENTE', 'CLIENTE');

-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('CANINO', 'FELINO', 'EXOTICO', 'EQUINO', 'BOVINO', 'OTRO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'HEMBRA');

-- CreateEnum
CREATE TYPE "EstadoReproductivo" AS ENUM ('ENTERO', 'CASTRADO', 'ESTERILIZADO');

-- CreateEnum
CREATE TYPE "Tamanio" AS ENUM ('PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE');

-- CreateEnum
CREATE TYPE "Caracter" AS ENUM ('DOCIL', 'NERVIOSO', 'AGRESIVO', 'MIEDOSO');

-- CreateEnum
CREATE TYPE "TipoCita" AS ENUM ('CONSULTA_GENERAL', 'CONTROL', 'VACUNACION', 'CIRUGIA', 'EMERGENCIA', 'TELEMEDICINA');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "EstadoFicha" AS ENUM ('EN_CURSO', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoHospitalizacion" AS ENUM ('ACTIVA', 'ALTA', 'TRANSFERIDO', 'FALLECIDO');

-- CreateEnum
CREATE TYPE "GravedadHospitalizacion" AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoCirugia" AS ENUM ('PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA', 'COMPLICACION');

-- CreateEnum
CREATE TYPE "TipoExamen" AS ENUM ('HEMOGRAMA', 'BIOQUIMICA', 'RADIOGRAFIA', 'ECOGRAFIA', 'ELECTROCARDIOGRAMA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoExamen" AS ENUM ('SOLICITADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaInventario" AS ENUM ('FARMACO', 'INSUMO', 'PRODUCTO_VENTA', 'EQUIPO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('INGRESO_COMPRA', 'SALIDA_CONSUMO', 'SALIDA_VENTA', 'AJUSTE_INVENTARIO', 'BAJA_VENCIMIENTO', 'BAJA_DANO');

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('BORRADOR', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_COMPLETA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'CHEQUE');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PAGADA', 'ANULADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('BOLETA', 'FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO');

-- CreateTable
CREATE TABLE "centros" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "direccion" VARCHAR(500),
    "telefono" VARCHAR(50),
    "email" VARCHAR(200),
    "capacidad_usuarios" INTEGER NOT NULL DEFAULT 50,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "nombre_completo" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "telefono" VARCHAR(50),
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutores" (
    "id" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(200) NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "telefono" VARCHAR(50) NOT NULL,
    "direccion" VARCHAR(500),
    "comuna" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "numero_ficha" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "especie" "Especie" NOT NULL,
    "raza" VARCHAR(100),
    "sexo" "Sexo" NOT NULL,
    "estado_reproductivo" "EstadoReproductivo" NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "edad_estimada_anios" INTEGER,
    "edad_estimada_meses" INTEGER,
    "peso_kg" DECIMAL(6,2),
    "chip" VARCHAR(50),
    "color" VARCHAR(100),
    "tamanio" "Tamanio",
    "caracter" "Caracter",
    "habitat" VARCHAR(200),
    "tipo_alimentacion" VARCHAR(200),
    "fallecido" BOOLEAN NOT NULL DEFAULT false,
    "fecha_fallecimiento" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "foto_url" VARCHAR(500),
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_peso" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "peso_kg" DECIMAL(6,2) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_peso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacunas" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "nombre_vacuna" VARCHAR(200) NOT NULL,
    "fecha_aplicacion" TIMESTAMP(3) NOT NULL,
    "proxima_dosis" TIMESTAMP(3),
    "lote" VARCHAR(100),
    "veterinario" VARCHAR(200),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacunas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fin" VARCHAR(5) NOT NULL,
    "duracion_cita_minutos" INTEGER NOT NULL DEFAULT 30,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ausencias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "motivo" VARCHAR(500),
    "tipo" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ausencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "veterinario_id" INTEGER NOT NULL,
    "box_id" INTEGER,
    "tipo" "TipoCita" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" VARCHAR(5) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL DEFAULT 30,
    "motivo" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_confirmacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_clinicas" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "veterinario_id" INTEGER NOT NULL,
    "cita_id" INTEGER,
    "fecha_consulta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo_consulta" TEXT NOT NULL,
    "duracion_sintomas" VARCHAR(200),
    "anamnesis_remota" TEXT,
    "anamnesis_actual" TEXT NOT NULL,
    "apetito" VARCHAR(200),
    "consumo_agua" VARCHAR(200),
    "defecacion" VARCHAR(200),
    "miccion" VARCHAR(200),
    "antecedentes" TEXT,
    "examen_fisico" TEXT,
    "temperatura" DECIMAL(4,1),
    "frecuencia_cardiaca" INTEGER,
    "frecuencia_respiratoria" INTEGER,
    "peso_kg" DECIMAL(6,2),
    "prediagnostico" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoFicha" NOT NULL DEFAULT 'EN_CURSO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examenes" (
    "id" SERIAL NOT NULL,
    "ficha_clinica_id" INTEGER,
    "hospitalizacion_id" INTEGER,
    "cirugia_id" INTEGER,
    "paciente_id" INTEGER NOT NULL,
    "tipo" "TipoExamen" NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_realizacion" TIMESTAMP(3),
    "estado" "EstadoExamen" NOT NULL DEFAULT 'SOLICITADO',
    "resultado_texto" TEXT,
    "resultado_archivo_url" VARCHAR(500),
    "precio" DECIMAL(10,2),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
    "id" SERIAL NOT NULL,
    "ficha_clinica_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "archivo_pdf_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalizaciones" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "veterinario_id" INTEGER NOT NULL,
    "box_id" INTEGER,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_alta" TIMESTAMP(3),
    "jaula" VARCHAR(100),
    "ubicacion" VARCHAR(200),
    "condicion" "GravedadHospitalizacion" NOT NULL,
    "prediagnostico" TEXT,
    "diagnostico" TEXT,
    "tratamiento_general" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoHospitalizacion" NOT NULL DEFAULT 'ACTIVA',
    "dias_hospitalizado" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitalizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signos_vitales" (
    "id" SERIAL NOT NULL,
    "hospitalizacion_id" INTEGER NOT NULL,
    "cirugia_id" INTEGER,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatura" DECIMAL(4,1),
    "frecuencia_cardiaca" INTEGER,
    "frecuencia_respiratoria" INTEGER,
    "presion_arterial_media" INTEGER,
    "spo2" INTEGER,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signos_vitales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tratamientos" (
    "id" SERIAL NOT NULL,
    "hospitalizacion_id" INTEGER NOT NULL,
    "medicamento" VARCHAR(200) NOT NULL,
    "presentacion" VARCHAR(100),
    "concentracion" VARCHAR(100),
    "dosis" VARCHAR(200) NOT NULL,
    "via_administracion" VARCHAR(100) NOT NULL,
    "frecuencia_horas" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "responsable" VARCHAR(200),
    "cobrar" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tratamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicaciones_tratamiento" (
    "id" SERIAL NOT NULL,
    "tratamiento_id" INTEGER NOT NULL,
    "fecha_hora_programada" TIMESTAMP(3) NOT NULL,
    "fecha_hora_aplicada" TIMESTAMP(3),
    "aplicado" BOOLEAN NOT NULL DEFAULT false,
    "responsable" VARCHAR(200),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicaciones_tratamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evoluciones" (
    "id" SERIAL NOT NULL,
    "hospitalizacion_id" INTEGER NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epicrisis" (
    "id" SERIAL NOT NULL,
    "hospitalizacion_id" INTEGER NOT NULL,
    "gravedad" "GravedadHospitalizacion" NOT NULL,
    "prediagnosticos" TEXT NOT NULL,
    "tratamientos_aplicados" TEXT NOT NULL,
    "examenes_recomendados" TEXT,
    "tratamientos_recomendados" TEXT,
    "observaciones_especiales" TEXT,
    "archivo_pdf_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epicrisis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cirugias" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "cirujano_id" INTEGER NOT NULL,
    "anestesista_id" INTEGER,
    "asistente_id" INTEGER,
    "box_id" INTEGER,
    "procedimiento" VARCHAR(300) NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora_inicio" VARCHAR(5),
    "hora_fin" VARCHAR(5),
    "duracion_minutos" INTEGER,
    "sala" VARCHAR(100),
    "estado" "EstadoCirugia" NOT NULL DEFAULT 'PROGRAMADA',
    "evaluacion_preanestesica" TEXT,
    "preanestesia" TEXT,
    "induccion" TEXT,
    "mantencion" TEXT,
    "complicaciones" TEXT,
    "reporte_quirurgico" TEXT,
    "reporte_anestesico" TEXT,
    "observaciones" TEXT,
    "archivo_pdf_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cirugias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "descuento_examenes" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuento_procedimientos" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuento_productos" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuento_cirugias" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuento_hospitalizacion" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios_pacientes" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "convenio_id" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenios_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "sku_interno" VARCHAR(100) NOT NULL,
    "codigo_barras" VARCHAR(100),
    "nombre" VARCHAR(300) NOT NULL,
    "categoria" "CategoriaInventario" NOT NULL,
    "descripcion" TEXT,
    "unidad_medida" VARCHAR(50) NOT NULL,
    "unidad_compra" VARCHAR(50),
    "factor_conversion" INTEGER NOT NULL DEFAULT 1,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "precio_compra" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "es_farmaco" BOOLEAN NOT NULL DEFAULT false,
    "presentacion" VARCHAR(200),
    "concentracion" VARCHAR(200),
    "volumen" VARCHAR(100),
    "es_multidosis" BOOLEAN NOT NULL DEFAULT false,
    "fecha_vencimiento" TIMESTAMP(3),
    "lote" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "inventario_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "origen" VARCHAR(200),
    "observaciones" TEXT,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos_utilizados" (
    "id" SERIAL NOT NULL,
    "inventario_id" INTEGER NOT NULL,
    "ficha_clinica_id" INTEGER,
    "cirugia_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "cobrado" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumos_utilizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "razon_social" VARCHAR(300) NOT NULL,
    "nombre_contacto" VARCHAR(200),
    "telefono" VARCHAR(50),
    "email" VARCHAR(200),
    "direccion" VARCHAR(500),
    "vendedor_asignado" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "numero_orden" VARCHAR(50) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_recepcion" TIMESTAMP(3),
    "estado" "EstadoOrdenCompra" NOT NULL DEFAULT 'BORRADOR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "archivo_pdf_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_orden_compra" (
    "id" SERIAL NOT NULL,
    "orden_compra_id" INTEGER NOT NULL,
    "inventario_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "numero_factura" VARCHAR(50) NOT NULL,
    "tipo_documento" "TipoDocumento" NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3),
    "fecha_pago" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "MetodoPago",
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "archivo_pdf_url" VARCHAR(500),
    "folio_sii" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_factura" (
    "id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "tipo_item" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "monto_inicial" DECIMAL(12,2) NOT NULL,
    "total_ingresos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_egresos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_esperado" DECIMAL(12,2),
    "monto_real" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "observaciones" TEXT,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" SERIAL NOT NULL,
    "caja_id" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "concepto" VARCHAR(300) NOT NULL,
    "metodo_pago" "MetodoPago",
    "observaciones" TEXT,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "numero_presupuesto" VARCHAR(50) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3),
    "descripcion" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "condiciones" TEXT,
    "aprobado" BOOLEAN,
    "archivo_pdf_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_presupuesto" (
    "id" SERIAL NOT NULL,
    "presupuesto_id" INTEGER NOT NULL,
    "tipo_item" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "tabla" VARCHAR(100) NOT NULL,
    "registro_id" INTEGER NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "datos_anteriores" TEXT,
    "datos_nuevos" TEXT,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "fecha_accion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "centros_codigo_key" ON "centros"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_rut_key" ON "usuarios"("rut");

-- CreateIndex
CREATE INDEX "usuarios_centro_id_idx" ON "usuarios"("centro_id");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rut_idx" ON "usuarios"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "tutores_rut_key" ON "tutores"("rut");

-- CreateIndex
CREATE INDEX "tutores_rut_idx" ON "tutores"("rut");

-- CreateIndex
CREATE INDEX "tutores_email_idx" ON "tutores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_chip_key" ON "pacientes"("chip");

-- CreateIndex
CREATE INDEX "pacientes_centro_id_idx" ON "pacientes"("centro_id");

-- CreateIndex
CREATE INDEX "pacientes_tutor_id_idx" ON "pacientes"("tutor_id");

-- CreateIndex
CREATE INDEX "pacientes_chip_idx" ON "pacientes"("chip");

-- CreateIndex
CREATE INDEX "pacientes_nombre_idx" ON "pacientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_centro_id_numero_ficha_key" ON "pacientes"("centro_id", "numero_ficha");

-- CreateIndex
CREATE INDEX "registros_peso_paciente_id_idx" ON "registros_peso"("paciente_id");

-- CreateIndex
CREATE INDEX "registros_peso_fecha_registro_idx" ON "registros_peso"("fecha_registro");

-- CreateIndex
CREATE INDEX "vacunas_paciente_id_idx" ON "vacunas"("paciente_id");

-- CreateIndex
CREATE INDEX "horarios_usuario_id_idx" ON "horarios"("usuario_id");

-- CreateIndex
CREATE INDEX "ausencias_usuario_id_idx" ON "ausencias"("usuario_id");

-- CreateIndex
CREATE INDEX "citas_centro_id_idx" ON "citas"("centro_id");

-- CreateIndex
CREATE INDEX "citas_paciente_id_idx" ON "citas"("paciente_id");

-- CreateIndex
CREATE INDEX "citas_tutor_id_idx" ON "citas"("tutor_id");

-- CreateIndex
CREATE INDEX "citas_veterinario_id_idx" ON "citas"("veterinario_id");

-- CreateIndex
CREATE INDEX "citas_fecha_idx" ON "citas"("fecha");

-- CreateIndex
CREATE INDEX "boxes_centro_id_idx" ON "boxes"("centro_id");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_clinicas_cita_id_key" ON "fichas_clinicas"("cita_id");

-- CreateIndex
CREATE INDEX "fichas_clinicas_centro_id_idx" ON "fichas_clinicas"("centro_id");

-- CreateIndex
CREATE INDEX "fichas_clinicas_paciente_id_idx" ON "fichas_clinicas"("paciente_id");

-- CreateIndex
CREATE INDEX "fichas_clinicas_veterinario_id_idx" ON "fichas_clinicas"("veterinario_id");

-- CreateIndex
CREATE INDEX "fichas_clinicas_fecha_consulta_idx" ON "fichas_clinicas"("fecha_consulta");

-- CreateIndex
CREATE INDEX "examenes_ficha_clinica_id_idx" ON "examenes"("ficha_clinica_id");

-- CreateIndex
CREATE INDEX "examenes_hospitalizacion_id_idx" ON "examenes"("hospitalizacion_id");

-- CreateIndex
CREATE INDEX "examenes_cirugia_id_idx" ON "examenes"("cirugia_id");

-- CreateIndex
CREATE INDEX "examenes_paciente_id_idx" ON "examenes"("paciente_id");

-- CreateIndex
CREATE INDEX "recetas_ficha_clinica_id_idx" ON "recetas"("ficha_clinica_id");

-- CreateIndex
CREATE INDEX "hospitalizaciones_centro_id_idx" ON "hospitalizaciones"("centro_id");

-- CreateIndex
CREATE INDEX "hospitalizaciones_paciente_id_idx" ON "hospitalizaciones"("paciente_id");

-- CreateIndex
CREATE INDEX "hospitalizaciones_veterinario_id_idx" ON "hospitalizaciones"("veterinario_id");

-- CreateIndex
CREATE INDEX "hospitalizaciones_estado_idx" ON "hospitalizaciones"("estado");

-- CreateIndex
CREATE INDEX "signos_vitales_hospitalizacion_id_idx" ON "signos_vitales"("hospitalizacion_id");

-- CreateIndex
CREATE INDEX "signos_vitales_cirugia_id_idx" ON "signos_vitales"("cirugia_id");

-- CreateIndex
CREATE INDEX "tratamientos_hospitalizacion_id_idx" ON "tratamientos"("hospitalizacion_id");

-- CreateIndex
CREATE INDEX "aplicaciones_tratamiento_tratamiento_id_idx" ON "aplicaciones_tratamiento"("tratamiento_id");

-- CreateIndex
CREATE INDEX "aplicaciones_tratamiento_fecha_hora_programada_idx" ON "aplicaciones_tratamiento"("fecha_hora_programada");

-- CreateIndex
CREATE INDEX "evoluciones_hospitalizacion_id_idx" ON "evoluciones"("hospitalizacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "epicrisis_hospitalizacion_id_key" ON "epicrisis"("hospitalizacion_id");

-- CreateIndex
CREATE INDEX "cirugias_centro_id_idx" ON "cirugias"("centro_id");

-- CreateIndex
CREATE INDEX "cirugias_paciente_id_idx" ON "cirugias"("paciente_id");

-- CreateIndex
CREATE INDEX "cirugias_cirujano_id_idx" ON "cirugias"("cirujano_id");

-- CreateIndex
CREATE INDEX "cirugias_fecha_idx" ON "cirugias"("fecha");

-- CreateIndex
CREATE INDEX "convenios_pacientes_paciente_id_idx" ON "convenios_pacientes"("paciente_id");

-- CreateIndex
CREATE INDEX "convenios_pacientes_convenio_id_idx" ON "convenios_pacientes"("convenio_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_sku_interno_key" ON "inventario"("sku_interno");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_codigo_barras_key" ON "inventario"("codigo_barras");

-- CreateIndex
CREATE INDEX "inventario_centro_id_idx" ON "inventario"("centro_id");

-- CreateIndex
CREATE INDEX "inventario_categoria_idx" ON "inventario"("categoria");

-- CreateIndex
CREATE INDEX "inventario_sku_interno_idx" ON "inventario"("sku_interno");

-- CreateIndex
CREATE INDEX "inventario_codigo_barras_idx" ON "inventario"("codigo_barras");

-- CreateIndex
CREATE INDEX "movimientos_inventario_inventario_id_idx" ON "movimientos_inventario"("inventario_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_usuario_id_idx" ON "movimientos_inventario"("usuario_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_fecha_movimiento_idx" ON "movimientos_inventario"("fecha_movimiento");

-- CreateIndex
CREATE INDEX "insumos_utilizados_inventario_id_idx" ON "insumos_utilizados"("inventario_id");

-- CreateIndex
CREATE INDEX "insumos_utilizados_ficha_clinica_id_idx" ON "insumos_utilizados"("ficha_clinica_id");

-- CreateIndex
CREATE INDEX "insumos_utilizados_cirugia_id_idx" ON "insumos_utilizados"("cirugia_id");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_rut_key" ON "proveedores"("rut");

-- CreateIndex
CREATE INDEX "proveedores_rut_idx" ON "proveedores"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_numero_orden_key" ON "ordenes_compra"("numero_orden");

-- CreateIndex
CREATE INDEX "ordenes_compra_centro_id_idx" ON "ordenes_compra"("centro_id");

-- CreateIndex
CREATE INDEX "ordenes_compra_proveedor_id_idx" ON "ordenes_compra"("proveedor_id");

-- CreateIndex
CREATE INDEX "ordenes_compra_usuario_id_idx" ON "ordenes_compra"("usuario_id");

-- CreateIndex
CREATE INDEX "items_orden_compra_orden_compra_id_idx" ON "items_orden_compra"("orden_compra_id");

-- CreateIndex
CREATE INDEX "items_orden_compra_inventario_id_idx" ON "items_orden_compra"("inventario_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_factura_key" ON "facturas"("numero_factura");

-- CreateIndex
CREATE INDEX "facturas_centro_id_idx" ON "facturas"("centro_id");

-- CreateIndex
CREATE INDEX "facturas_paciente_id_idx" ON "facturas"("paciente_id");

-- CreateIndex
CREATE INDEX "facturas_tutor_id_idx" ON "facturas"("tutor_id");

-- CreateIndex
CREATE INDEX "facturas_usuario_id_idx" ON "facturas"("usuario_id");

-- CreateIndex
CREATE INDEX "facturas_fecha_emision_idx" ON "facturas"("fecha_emision");

-- CreateIndex
CREATE INDEX "items_factura_factura_id_idx" ON "items_factura"("factura_id");

-- CreateIndex
CREATE INDEX "cajas_centro_id_idx" ON "cajas"("centro_id");

-- CreateIndex
CREATE INDEX "cajas_usuario_id_idx" ON "cajas"("usuario_id");

-- CreateIndex
CREATE INDEX "cajas_fecha_apertura_idx" ON "cajas"("fecha_apertura");

-- CreateIndex
CREATE INDEX "movimientos_caja_caja_id_idx" ON "movimientos_caja"("caja_id");

-- CreateIndex
CREATE INDEX "movimientos_caja_fecha_movimiento_idx" ON "movimientos_caja"("fecha_movimiento");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_numero_presupuesto_key" ON "presupuestos"("numero_presupuesto");

-- CreateIndex
CREATE INDEX "presupuestos_paciente_id_idx" ON "presupuestos"("paciente_id");

-- CreateIndex
CREATE INDEX "presupuestos_tutor_id_idx" ON "presupuestos"("tutor_id");

-- CreateIndex
CREATE INDEX "items_presupuesto_presupuesto_id_idx" ON "items_presupuesto"("presupuesto_id");

-- CreateIndex
CREATE INDEX "audit_logs_usuario_id_idx" ON "audit_logs"("usuario_id");

-- CreateIndex
CREATE INDEX "audit_logs_tabla_idx" ON "audit_logs"("tabla");

-- CreateIndex
CREATE INDEX "audit_logs_fecha_accion_idx" ON "audit_logs"("fecha_accion");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_peso" ADD CONSTRAINT "registros_peso_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacunas" ADD CONSTRAINT "vacunas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausencias" ADD CONSTRAINT "ausencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes" ADD CONSTRAINT "boxes_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_clinicas" ADD CONSTRAINT "fichas_clinicas_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_clinicas" ADD CONSTRAINT "fichas_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_clinicas" ADD CONSTRAINT "fichas_clinicas_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_clinicas" ADD CONSTRAINT "fichas_clinicas_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_ficha_clinica_id_fkey" FOREIGN KEY ("ficha_clinica_id") REFERENCES "fichas_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_cirugia_id_fkey" FOREIGN KEY ("cirugia_id") REFERENCES "cirugias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examenes" ADD CONSTRAINT "examenes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_ficha_clinica_id_fkey" FOREIGN KEY ("ficha_clinica_id") REFERENCES "fichas_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizaciones" ADD CONSTRAINT "hospitalizaciones_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signos_vitales" ADD CONSTRAINT "signos_vitales_cirugia_id_fkey" FOREIGN KEY ("cirugia_id") REFERENCES "cirugias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicaciones_tratamiento" ADD CONSTRAINT "aplicaciones_tratamiento_tratamiento_id_fkey" FOREIGN KEY ("tratamiento_id") REFERENCES "tratamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones" ADD CONSTRAINT "evoluciones_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epicrisis" ADD CONSTRAINT "epicrisis_hospitalizacion_id_fkey" FOREIGN KEY ("hospitalizacion_id") REFERENCES "hospitalizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cirugias" ADD CONSTRAINT "cirugias_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cirugias" ADD CONSTRAINT "cirugias_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cirugias" ADD CONSTRAINT "cirugias_cirujano_id_fkey" FOREIGN KEY ("cirujano_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cirugias" ADD CONSTRAINT "cirugias_anestesista_id_fkey" FOREIGN KEY ("anestesista_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cirugias" ADD CONSTRAINT "cirugias_asistente_id_fkey" FOREIGN KEY ("asistente_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cirugias" ADD CONSTRAINT "cirugias_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios_pacientes" ADD CONSTRAINT "convenios_pacientes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios_pacientes" ADD CONSTRAINT "convenios_pacientes_convenio_id_fkey" FOREIGN KEY ("convenio_id") REFERENCES "convenios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_utilizados" ADD CONSTRAINT "insumos_utilizados_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_utilizados" ADD CONSTRAINT "insumos_utilizados_ficha_clinica_id_fkey" FOREIGN KEY ("ficha_clinica_id") REFERENCES "fichas_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumos_utilizados" ADD CONSTRAINT "insumos_utilizados_cirugia_id_fkey" FOREIGN KEY ("cirugia_id") REFERENCES "cirugias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_orden_compra" ADD CONSTRAINT "items_orden_compra_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_presupuesto_id_fkey" FOREIGN KEY ("presupuesto_id") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
