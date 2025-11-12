/**
 * Utilidades para generación de Boletas/Facturas
 */

interface BoletaData {
  // Centro
  centroNombre: string;
  centroRut: string;
  centroDireccion: string;
  centroTelefono: string;

  // Cliente/Tutor
  tutorNombre: string;
  tutorDireccion: string;
  tutorTelefono: string;

  // Paciente
  pacienteNombre: string;
  pacienteEspecie: string;
  pacienteRaza: string;
  pacienteEdad: string;
  pacienteId: string;

  // Factura
  numeroFactura: string;
  tipoDocumento: string;
  fechaEmision: string;
  folioSII?: string;

  // Items
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;

  // Totales
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;

  // Observaciones
  observaciones?: string;
}

/**
 * Formatea números a pesos chilenos
 */
export function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
}

/**
 * Genera HTML de boleta/factura
 */
export function generarBoletaHTML(data: BoletaData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.descripcion}</td>
      <td>${item.cantidad}</td>
      <td>${formatCLP(item.precioUnitario)}</td>
      <td>${formatCLP(item.subtotal)}</td>
    </tr>
  `
    )
    .join('');

  const descuentoHTML = data.descuento > 0
    ? `Descuento: ${formatCLP(data.descuento)}<br>`
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.tipoDocumento} - ${data.numeroFactura}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .invoice-container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
        }
        .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a; /* Azul Universidad de Chile */
        }
        .clinic-subtitle {
            font-size: 16px;
            color: #3b82f6;
            font-weight: bold;
        }
        .clinic-address {
            color: #7f8c8d;
            font-size: 14px;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .client-info, .pet-info {
            width: 48%;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table th, .table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        .table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .total-row {
            font-weight: bold;
            text-align: right;
            font-size: 16px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            border-top: 1px dashed #ddd;
            padding-top: 15px;
        }
        .print-btn {
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #1e3a8a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        .print-btn:hover {
            background-color: #1d4ed8;
        }
        @media print {
            .print-btn {
                display: none;
            }
            body {
                background-color: white;
                margin: 0;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="clinic-name">${data.centroNombre}</div>
            <div class="clinic-subtitle">Red de Atención - Universidad de Chile</div>
            <div class="clinic-address">
                Facultad de Ciencias Veterinarias y Pecuarias<br>
                Universidad de Chile<br>
                ${data.centroDireccion}<br>
                Tel: ${data.centroTelefono}
            </div>
        </div>

        <div class="invoice-info">
            <div class="client-info">
                <strong>${data.tipoDocumento} a:</strong><br>
                ${data.tutorNombre}<br>
                ${data.tutorDireccion}<br>
                Tel: ${data.tutorTelefono}
            </div>
            <div class="pet-info">
                <strong>Mascota:</strong><br>
                Nombre: ${data.pacienteNombre}<br>
                Especie: ${data.pacienteEspecie}<br>
                Raza: ${data.pacienteRaza}<br>
                Edad: ${data.pacienteEdad}<br>
                ID: ${data.pacienteId}
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario (CLP)</th>
                    <th>Subtotal (CLP)</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="total-row">
            Subtotal: ${formatCLP(data.subtotal)}<br>
            ${descuentoHTML}
            IVA (19%): ${formatCLP(data.iva)}<br>
            <span style="font-size: 18px;">TOTAL: ${formatCLP(data.total)}</span>
        </div>

        ${data.observaciones ? `
        <div style="margin-top: 30px;">
            <strong>Observaciones:</strong><br>
            ${data.observaciones}
        </div>
        ` : ''}

        <div class="footer">
            Gracias por confiar en la Red de Atención FAVET - Universidad de Chile.<br>
            Esta ${data.tipoDocumento.toLowerCase()} es válida como comprobante fiscal. Fecha de emisión: ${data.fechaEmision}<br>
            Nº ${data.tipoDocumento}: ${data.numeroFactura} | RUT: ${data.centroRut}
            ${data.folioSII ? ` | Folio SII: ${data.folioSII}` : ''}
        </div>

        <button class="print-btn" onclick="window.print()">Imprimir ${data.tipoDocumento}</button>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Calcula edad a partir de fecha de nacimiento
 */
export function calcularEdad(fechaNacimiento: Date): string {
  const hoy = new Date();
  const diff = hoy.getTime() - fechaNacimiento.getTime();
  const años = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const meses = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

  if (años > 0) {
    return meses > 0 ? `${años} años y ${meses} meses` : `${años} años`;
  }
  return `${meses} meses`;
}
