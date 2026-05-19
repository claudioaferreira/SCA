import { Injectable } from '@angular/core';
import { Despliegue, DetalleRuta, CentroDetalle } from '../interfaces/despliegue.interface';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({ providedIn: 'root' })
export class DesplieguesExcelService {

  /** Genera y descarga el Excel del despliegue */
  async exportar(
    detalle:        Despliegue,
    rutas:          DetalleRuta[],
    estadosCentros: Map<number, string | null>
  ): Promise<void> {



    const wb = new Workbook();
    const ws = wb.addWorksheet('Despliegue');

    ws.columns = [
      { key: 'no',         width: 5  },
      { key: 'zona',       width: 26 },
      { key: 'ruta',       width: 7  },
      { key: 'centro',     width: 45 },
      { key: 'tecnico',    width: 32 },
      { key: 'codigo',     width: 16 },
      { key: 'comentario', width: 35 },
      { key: 'estado',     width: 14 },
    ];

    this.agregarTitulo(ws, detalle);
    this.agregarEncabezados(ws);
    this.agregarDatos(ws, rutas, estadosCentros);

    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${detalle.Titulo} - ${new Date().toLocaleDateString('es-DO')}.xlsx`);
  }

  // ── Privados ────────────────────────────────────────────────────

  private agregarTitulo(ws: any, detalle: Despliegue): void {
    ws.mergeCells('A1:H1');
    const titulo       = ws.getCell('A1');
    titulo.value       = detalle.Titulo;
    titulo.font        = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    titulo.fill        = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
    titulo.alignment   = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 22;

    ws.mergeCells('A2:H2');
    const sub       = ws.getCell('A2');
    sub.value       = `Período: ${detalle.FechaInicio} — ${detalle.FechaFin}   |   Generado: ${new Date().toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    sub.font        = { size: 9, italic: true, color: { argb: 'FF888888' } };
    sub.alignment   = { horizontal: 'center' };
  }

  private agregarEncabezados(ws: any): void {
    const fila = ws.addRow(['NO.', 'ZONA', 'RUTA', 'CENTRO DE CEDULACIÓN', 'SOPORTE TÉCNICO', 'CÓDIGO', 'COMENTARIO', 'ESTADO']);
    fila.height = 18;
    fila.eachCell((cell: any) => {
      cell.font      = { bold: true, size: 9, color: { argb: 'FFD4A017' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D2D' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border    = { bottom: { style: 'medium', color: { argb: 'FF444444' } } };
    });
  }

  private agregarDatos(ws: any, rutas: DetalleRuta[], estadosCentros: Map<number, string | null>): void {
    let filaExcel  = 4;
    let contadorNo = 1;

    for (const ruta of rutas) {
      const centros = this.parseCentros(ruta.CentrosJSON);
      if (!centros.length) continue;

      const filaInicio = filaExcel;

      centros.forEach((centro, i) => {
        const estado  = estadosCentros.get(centro.IdRutaCentro) ?? centro.Estado ?? null;
        const isListo = estado === 'Listo';
        const bgArgb  = isListo ? 'FFE8F5E9' : 'FFFFFFFF';

        const fila = ws.addRow([
          contadorNo,
          i === 0 ? (ruta.ZonaOperativa ?? '')  : '',
          i === 0 ? ruta.NumeroRuta              : '',
          centro.Centro,
          i === 0 ? (ruta.Empleado ?? '')        : '',
          i === 0 ? (ruta.CodigoEmpleado ?? '')  : '',
          i === 0 ? (ruta.Comentario ?? '')      : '',
          isListo ? '✓ Listo' : 'Pendiente',
        ]);

        fila.eachCell({ includeEmpty: true }, (cell: any, col: number) => {
          cell.font      = { size: 9 };
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
          cell.alignment = { vertical: 'middle', wrapText: col === 7 };
          cell.border    = {
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right:  { style: 'thin', color: { argb: 'FFEEEEEE' } },
          };
          if (col === 1 || col === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        if (i === 0) {
          fila.getCell(2).font = { bold: true, size: 9, color: { argb: 'FFC6940A' } };
          fila.getCell(5).font = { bold: true, size: 9 };
          fila.getCell(6).font = { bold: true, size: 9 };
          fila.eachCell({ includeEmpty: true }, (cell: any) => {
            cell.border = { ...cell.border, top: { style: 'medium', color: { argb: 'FFC6940A' } } };
          });
        }

        fila.getCell(8).font      = { bold: isListo, size: 9, color: { argb: isListo ? 'FF2E7D32' : 'FFAAAAAA' } };
        fila.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

        contadorNo++;
        filaExcel++;
      });

      // Combinar celda de COMENTARIO por ruta
      if (centros.length > 1) {
        ws.mergeCells(filaInicio, 7, filaExcel - 1, 7);
        const celdaComentario     = ws.getCell(filaInicio, 7);
        celdaComentario.value     = ruta.Comentario ?? '';
        celdaComentario.font      = { size: 9 };
        celdaComentario.alignment = { vertical: 'top', wrapText: true };
      }
    }
  }

  private parseCentros(json: string | null): CentroDetalle[] {
    if (!json) return [];
    try { return JSON.parse(json); }
    catch { return []; }
  }
}