from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

OUT = Path('output/pdf')
OUT.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor('#123B5D')
BLUE = colors.HexColor('#1F6E8C')
LIGHT = colors.HexColor('#EAF3F7')
GRAY = colors.HexColor('#F4F6F8')
GREEN = colors.HexColor('#DDEFE2')
AMBER = colors.HexColor('#FFF0CC')
RED = colors.HexColor('#F9DCDD')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=24, leading=30, textColor=NAVY, alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name='CoverSub', parent=styles['Normal'], fontSize=12, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#34495E')))
styles.add(ParagraphStyle(name='H1Bida', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=NAVY, spaceBefore=6, spaceAfter=9))
styles.add(ParagraphStyle(name='H2Bida', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11.5, leading=14, textColor=BLUE, spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name='BodyBida', parent=styles['BodyText'], fontSize=9.2, leading=13, alignment=TA_JUSTIFY, spaceAfter=6))
styles.add(ParagraphStyle(name='SmallBida', parent=styles['BodyText'], fontSize=7.5, leading=9.5))
styles.add(ParagraphStyle(name='TableHead', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=7.4, leading=9, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='TableCell', parent=styles['BodyText'], fontSize=7.2, leading=9))
styles.add(ParagraphStyle(name='TableCellCenter', parent=styles['BodyText'], fontSize=7.2, leading=9, alignment=TA_CENTER))

def p(text, style='BodyBida'):
    return Paragraph(str(text), styles[style])

def table(headers, rows, widths, highlights=None):
    data = [[p(h, 'TableHead') for h in headers]] + [[p(c, 'TableCellCenter' if i in (1,2) and len(headers) <= 5 else 'TableCell') for i,c in enumerate(row)] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    commands = [
        ('BACKGROUND', (0,0), (-1,0), NAVY), ('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#AAB7C4')), ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),5), ('RIGHTPADDING',(0,0),(-1,-1),5),
        ('TOPPADDING',(0,0),(-1,-1),5), ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, GRAY])
    ]
    if highlights:
        for row, color in highlights.items(): commands.append(('BACKGROUND',(0,row),(-1,row),color))
    t.setStyle(TableStyle(commands)); return t

def footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(colors.HexColor('#C5D5E0')); canvas.line(1.7*cm, 1.25*cm, 19.9*cm, 1.25*cm)
    canvas.setFont('Helvetica', 7.5); canvas.setFillColor(colors.HexColor('#52616B'))
    canvas.drawString(1.7*cm, .82*cm, 'BIDA - Gestión odontológica | Evidencia GA11 - Calidad de software')
    canvas.drawRightString(19.9*cm, .82*cm, f'Página {doc.page}')
    canvas.restoreState()

def cover(title, code, subtitle):
    return [Spacer(1, 3.2*cm), p('SERVICIO NACIONAL DE APRENDIZAJE - SENA', 'CoverSub'), Spacer(1,.35*cm),
            p('Análisis y desarrollo de software', 'CoverSub'), Spacer(1,1.7*cm), p(title, 'CoverTitle'),
            p(code, 'CoverSub'), Spacer(1,.8*cm), p(subtitle, 'CoverSub'), Spacer(1,2.6*cm),
            p('<b>Proyecto:</b> BIDA - Sistema de gestión para clínica odontológica', 'CoverSub'), Spacer(1,.4*cm),
            p('<b>Fase:</b> Evaluación &nbsp;&nbsp; | &nbsp;&nbsp; <b>Competencia:</b> 220501098', 'CoverSub'), Spacer(1,1.2*cm),
            p('<b>Aprendiz:</b> ________________________________', 'CoverSub'), Spacer(1,.25*cm), p('<b>Fecha:</b> 7 de octubre de 2026', 'CoverSub'), PageBreak()]

def build(name, story):
    doc = SimpleDocTemplate(str(OUT/name), pagesize=letter, rightMargin=1.7*cm, leftMargin=1.7*cm, topMargin=1.45*cm, bottomMargin=1.6*cm, title=name.stem)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)

# EV03
s = cover('Instrumentos diligenciados para documentar procesos de calidad', 'GA11-220501098-AA1-EV03', 'Aplicación de instrumentos de calidad de software para BIDA')
s += [p('Introducción','H1Bida'), p('Este documento registra instrumentos sencillos y trazables para controlar la calidad de BIDA, una aplicación web para la administración de una clínica odontológica. Se evaluaron funciones presentes en el repositorio: agenda, clientes, empleados, tratamientos, productos, equipos odontológicos, novedades y ventas. Los instrumentos siguen prácticas de Scrum, pruebas funcionales, revisión entre pares y trazabilidad de hallazgos.'),
      p('1. Ficha de control de calidad','H1Bida'), table(['Campo','Registro'],[
          ('Producto evaluado','BIDA - sistema web de gestión odontológica'),('Versión revisada','Código fuente disponible el 7/10/2026'),('Alcance','API Express, rutas CRUD y controles de acceso de agenda'),('Responsables','Equipo de desarrollo BIDA; revisión: aprendiz'),('Criterio general','Respuesta esperada, validación de datos, autorización y persistencia consistente'),('Evidencias','Suite Jest, revisión de rutas y checklist diligenciado')],[4.1*cm,14.1*cm]),
      Spacer(1,.25*cm), p('2. Checklist de calidad diligenciado','H1Bida'), p('Resultado de la inspección documental y de pruebas sobre el código actual de BIDA. Cumple significa que existe implementación o evidencia automatizada; Parcial indica una oportunidad de mejora que debe entrar al backlog.'),
      table(['Ítem a verificar','Estado','Observación / evidencia'],[
          ('Las rutas de agenda validan los campos obligatorios?','Cumple','POST y PUT exigen fecha, hora, paciente y tratamiento; las pruebas cubren respuesta 400.'),
          ('La agenda limita acciones administrativas?','Cumple','Crear, editar y eliminar citas requiere sesión y especialidad Administración.'),
          ('La agenda limita la consulta de un profesional a sus citas?','Cumple','GET /cita filtra por idEmpleado para perfiles no administrativos.'),
          ('Los productos cuentan con operaciones CRUD?','Cumple','Rutas GET, POST, PUT y DELETE disponibles y cubiertas por pruebas.'),
          ('La venta actualiza el inventario dentro de una transacción?','Cumple','Se inserta el detalle y se descuenta stock; se ejecuta ROLLBACK ante error.'),
          ('La venta evita stock negativo?','Cumple','La actualización exige stockActual >= cantidad solicitada.'),
          ('Los módulos principales tienen pruebas automatizadas?','Cumple','Jest reporta 41 pruebas aprobadas en 6 conjuntos.'),
          ('Todas las operaciones sensibles tienen pruebas de autorización?','Parcial','La agenda sí tiene pruebas de 401 y 403. Se recomienda ampliar cobertura equivalente a productos, ventas y clientes.'),
          ('La configuración de CORS está centralizada?','Parcial','app.js registra cors() dos veces; se debe conservar una configuración explícita.'),
          ('El README describe cómo ejecutar y probar el proyecto?','No cumple','El archivo contiene conflicto de merge visible y no brinda instrucciones operativas.'),
          ('Los mensajes al usuario conservan codificación legible?','Parcial','En archivos fuente se observan caracteres con codificación inconsistente; verificar UTF-8.'),
          ('La base de datos se prueba con entorno aislado?','Parcial','Las pruebas usan conexión simulada; agregar pruebas de integración con BD de prueba.')],[6.3*cm,2.1*cm,9.8*cm], {8:AMBER,9:AMBER,10:RED,11:AMBER,12:AMBER}),
      PageBreak(), p('3. Registro de ejecución de pruebas','H1Bida'), table(['ID','Escenario','Resultado esperado','Resultado','Estado'],[
          ('CP-01','Consultar agenda con sesión administrativa','200 y listado de citas','La suite valida el listado y total de citas.','Aprobada'),
          ('CP-02','Consultar agenda como profesional','200 y filtro por profesional','Se verifica filtro por idEmpleado.','Aprobada'),
          ('CP-03','Crear cita sin campos obligatorios','400 y mensaje de validación','Prueba automatizada aprobada.','Aprobada'),
          ('CP-04','Crear cita como perfil no administrativo','403','Prueba automatizada aprobada.','Aprobada'),
          ('CP-05','Actualizar y eliminar cita inexistente','404','Pruebas automatizadas aprobadas.','Aprobada'),
          ('CP-06','Consultar producto existente/inexistente','200 / 404','Pruebas automatizadas aprobadas.','Aprobada'),
          ('CP-07','Registrar producto y actualizarlo','201 / 200','Pruebas automatizadas aprobadas.','Aprobada'),
          ('CP-08','Falla de consulta de productos','500 controlado','Prueba automatizada aprobada.','Aprobada')],[1.5*cm,4.3*cm,4.0*cm,5.1*cm,2.0*cm]),
      Spacer(1,.25*cm), p('4. Registro de hallazgos y acciones','H1Bida'), table(['ID','Hallazgo','Severidad','Acción propuesta','Responsable'],[
          ('H-01','README con marcadores de conflicto de merge.','Media','Resolver el conflicto, documentar instalación, variables de entorno y pruebas.','Líder técnico'),
          ('H-02','Cobertura de autorización concentrada en agenda.','Media','Agregar casos 401/403 para rutas sensibles de los demás módulos.','Equipo backend'),
          ('H-03','CORS duplicado y caracteres con codificación inconsistente.','Baja','Centralizar middleware y normalizar archivos a UTF-8.','Equipo backend')],[1.2*cm,5.5*cm,1.8*cm,5.5*cm,3.0*cm]),
      p('Conclusiones','H1Bida'), p('BIDA dispone de una base funcional verificable: la suite actual supera 41 pruebas y la agenda incorpora validación y control por perfil. El checklist deja trazadas tres oportunidades que no bloquean el funcionamiento demostrado, pero que deben gestionarse para elevar mantenibilidad, seguridad y repetibilidad de la evaluación.')]
build(Path('01_GA11_AA1_EV03_Instrumentos_calidad_BIDA.pdf'), s)

# EV01 report
s = cover('Informe de resultados del comportamiento del software', 'GA11-220501098-AA2-EV01', 'Evaluación de calidad y bitácora de lecciones aprendidas de BIDA')
s += [p('Introducción','H1Bida'), p('El presente informe comunica los resultados de la evaluación del comportamiento de BIDA. La evaluación combina ejecución de la suite automatizada del repositorio y revisión de los flujos críticos implementados. El objetivo es determinar si las funciones evaluadas entregan respuestas controladas y si existen acciones de mejora priorizables.'),
      p('1. Resumen ejecutivo','H1Bida'), table(['Indicador','Resultado','Interpretación'],[
          ('Ejecución de pruebas automatizadas','41 aprobadas de 41','No se identificaron fallos en los casos automatizados ejecutados.'),('Conjuntos de prueba','6 aprobados de 6','La ejecución completó sin suites fallidas.'),('Módulos con evidencia de pruebas','Agenda, productos y módulos adicionales del repositorio','Existe automatización funcional; requiere ampliar alcance de seguridad e integración.'),('Hallazgos de revisión documental','3','Se priorizan documentación, cobertura de autorización y normalización técnica.')],[5.1*cm,4.5*cm,7.3*cm]),
      p('2. Recursos utilizados para la evaluación','H1Bida'), table(['Recurso','Registro'],[
          ('Equipo evaluador','Aprendiz responsable de la evidencia, con apoyo del equipo de desarrollo BIDA.'),('Infraestructura','Equipo local, Node.js, npm, Jest, Supertest y conexión MySQL configurada por variables de entorno.'),('Artefactos evaluados','app.js, rutas de Express, pruebas ubicadas en /test y módulos web de BIDA.'),('Marcos de trabajo','Scrum para mejora iterativa; prácticas de pruebas unitarias/integración, revisión de código y Definition of Done.'),('Fidelidad de medición','Alta para los casos automatizados ejecutados; media para la inspección documental; no cubre rendimiento, usabilidad en usuarios reales ni producción.')],[4.7*cm,12.2*cm]),
      PageBreak(), p('3. Métricas, ponderación y criterios de aprobación','H1Bida'), table(['Métrica','Ponderación','Resultado','Criterio de aprobación'],[
          ('Pruebas automatizadas exitosas','40%','100% (41/41)','>= 90% de los casos ejecutados aprobados.'),('Validación de datos y respuestas HTTP','20%','Cumple en escenarios revisados','Rutas críticas responden 2xx, 4xx o 5xx de forma controlada.'),('Control de acceso de agenda','20%','Cumple','Acciones administrativas requieren perfil de Administración.'),('Trazabilidad y documentación','10%','Parcial','Sin conflictos de merge y con guía operativa actualizada.'),('Mantenibilidad técnica','10%','Parcial','Sin middleware duplicado, codificación uniforme y cobertura ampliada.')],[4.4*cm,2.6*cm,3.7*cm,6.2*cm]),
      Spacer(1,.25*cm), p('Resultado ponderado: 88 / 100 - Aprobado con plan de mejora.','H2Bida'), p('La aprobación se fundamenta en el 100% de éxito de la ejecución automatizada y en los controles validados en agenda. Se condiciona la siguiente iteración a cerrar los hallazgos H-01 a H-03 del instrumento de calidad.'),
      p('4. Tipos de pruebas realizadas','H1Bida'), table(['Tipo','Casos observados','Resultado'],[
          ('Funcionales de API','Consulta, creación, actualización y eliminación de citas y productos.','Aprobadas en los casos ejecutados.'),('Validación','Campos obligatorios en agenda y respuesta ante recursos inexistentes.','Aprobadas.'),('Autorización','Restricción de agenda según sesión y especialidad del empleado.','Aprobadas.'),('Manejo de errores','Error de base de datos simulado para productos.','Aprobada: respuesta 500 controlada.'),('Transaccional (revisión de código)','Registro de venta, detalle e inventario con COMMIT/ROLLBACK.','Implementado; requiere prueba de integración real.')],[3.2*cm,7.5*cm,6.2*cm]),
      p('5. Bitácora de lecciones aprendidas','H1Bida'), table(['Fecha','Situación','Lección aprendida','Acción para próximas iteraciones'],[
          ('07/10/2026','La suite pasó sin fallos, pero la revisión detectó oportunidades fuera de los casos probados.','El éxito de pruebas no reemplaza la revisión de configuración y documentación.','Añadir checklist de entrega al cierre de cada sprint.'),('07/10/2026','La agenda tiene controles por perfil claramente probados.','Los controles de autorización deben aplicarse y probarse de forma uniforme en rutas sensibles.','Definir matriz de roles y pruebas 401/403 por módulo.'),('07/10/2026','La venta incluye transacción e inventario.','Los flujos con datos críticos requieren pruebas con base de datos aislada.','Crear ambiente de pruebas e incluir datos semilla.')],[2.0*cm,4.3*cm,5.4*cm,5.2*cm]),
      p('Conclusiones','H1Bida'), p('El comportamiento evaluado de BIDA es satisfactorio para los casos automatizados disponibles: 41 de 41 pruebas fueron aprobadas. Los resultados respaldan la continuidad del desarrollo, mientras el equipo incorpora mejoras de trazabilidad, seguridad verificable y preparación de pruebas de integración con base de datos.')]
build(Path('02_GA11_AA2_EV01_Informe_resultados_BIDA.pdf'), s)

# EV01 adjustments
s = cover('Ajustes en los procesos de desarrollo de software', 'GA11-220501098-AA3-EV01', 'Plan de mejora para la calidad del proceso de desarrollo de BIDA')
s += [p('Introducción','H1Bida'), p('Este documento propone y documenta ajustes al proceso de desarrollo de BIDA a partir de los resultados de verificación. Se adopta Scrum como metodología de referencia porque el proyecto se organiza por incrementos funcionales y permite convertir hallazgos de calidad en elementos priorizados del backlog.'),
      p('1. Metodología seleccionada y situación evaluada','H1Bida'), table(['Elemento','Aplicación en BIDA'],[
          ('Metodología','Scrum: planificación de sprint, construcción incremental, revisión y retrospectiva.'),('Entrada para mejora','Instrumentos de calidad diligenciados, salida de Jest (41/41) y revisión de código/documentación.'),('Problemas priorizados','Documentación incompleta con conflicto de merge; cobertura insuficiente de autorización; configuración y codificación por normalizar.'),('Objetivo del ajuste','Hacer repetible la verificación de calidad antes de integrar y publicar cambios.')],[4.6*cm,12.3*cm]),
      p('2. Cambios en la secuencia de ejecución','H1Bida'), table(['Momento del sprint','Proceso actual observado','Ajuste propuesto','Evidencia de cumplimiento'],[
          ('Planificación','Historias orientadas a funcionalidad.','Agregar criterios de aceptación de seguridad, validación y prueba por historia.','Historia refinada y checklist de criterios.'),('Desarrollo','Implementación de rutas y vistas.','Aplicar revisión de código por pares antes del merge.','Pull request con aprobación o registro de revisión.'),('Pruebas','Ejecución de pruebas disponibles.','Ejecutar npm test y registrar resultado antes del cierre.','Salida de pruebas adjunta a la evidencia.'),('Cierre','Entrega funcional.','Actualizar README, resolver conflictos y verificar codificación UTF-8.','Checklist de Definition of Done firmado.'),('Retrospectiva','Mejoras no siempre formalizadas.','Registrar hallazgos y crear tareas de mejora con responsable y fecha.','Backlog de mejora actualizado.')],[2.8*cm,3.5*cm,6.6*cm,4.0*cm]),
      PageBreak(), p('3. Ajustes operativos y técnicos','H1Bida'), table(['Nivel','Ajuste','Justificación','Resultado esperado'],[
          ('Operativo','Incluir una reunión de refinamiento de calidad antes de iniciar cada sprint.','Asegura requisitos claros y criterios verificables.','Menos retrabajo por requisitos ambiguos.'),('Operativo','Usar checklist obligatorio al cerrar historias.','Evita omitir documentación, pruebas o revisión.','Entrega trazable y repetible.'),('Técnico','Resolver el conflicto en README y documentar ejecución, variables y pruebas.','Mejora la incorporación de integrantes y la reproducibilidad.','Proyecto instalable y verificable por terceros.'),('Técnico','Ampliar pruebas de autenticación/autorización a productos, ventas y clientes.','Reduce exposición de operaciones administrativas.','Accesos no autorizados detectados por pruebas.'),('Técnico','Centralizar CORS y normalizar fuentes a UTF-8.','Elimina configuración redundante y mensajes ilegibles.','Código mantenible y respuestas legibles.'),('Técnico','Crear base de datos de pruebas y casos para venta e inventario.','Valida transacciones con datos reales aislados.','Mayor confianza en flujos críticos.')],[2.0*cm,4.2*cm,5.3*cm,5.4*cm]),
      p('4. Plan de mejora diligenciado','H1Bida'), table(['Ajuste','Responsable','Fecha objetivo','Impacto esperado'],[
          ('Resolver README y crear guía de ejecución/pruebas.','Líder técnico','Antes del próximo sprint','Documentación confiable y reducción de errores de instalación.'),('Añadir criterios de seguridad y checklist al Definition of Done.','Product Owner y equipo','Próxima planificación','Requisitos y calidad verificables desde el inicio.'),('Implementar pruebas 401/403 en rutas sensibles.','Equipo backend','Próximo sprint','Reducción del riesgo de acceso no autorizado.'),('Centralizar CORS y normalizar a UTF-8.','Equipo backend','Próximo sprint','Configuración clara y mensajes consistentes.'),('Montar BD de pruebas para venta/inventario.','QA y backend','Siguiente sprint','Detección temprana de fallos transaccionales.')],[5.4*cm,3.0*cm,3.4*cm,5.2*cm]),
      p('5. Seguimiento y criterios de verificación','H1Bida'), p('Cada ajuste se validará en la revisión del sprint. Se considerará completado cuando exista evidencia en el repositorio: README sin conflictos, pruebas automatizadas ejecutadas sin fallos, checklist de cierre diligenciado, pruebas de roles agregadas y configuración revisada por pares. Los hallazgos abiertos se conservarán en el backlog hasta que la evidencia confirme su cierre.'),
      p('Conclusiones','H1Bida'), p('La evaluación de BIDA muestra un núcleo funcional estable y una oportunidad concreta de fortalecer el proceso. Los ajustes propuestos conectan los resultados de las pruebas con acciones operativas y técnicas medibles. Su aplicación en el siguiente sprint permite elevar la calidad sin interrumpir el desarrollo de los módulos clínicos y administrativos.')]
build(Path('03_GA11_AA3_EV01_Ajustes_proceso_BIDA.pdf'), s)

print('PDFs created in', OUT)
