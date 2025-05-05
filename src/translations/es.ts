
const translations = {
  // Common
  'app.title': 'HoReCa Móvil',
  'app.language': 'Idioma',
  'app.logout': 'Cerrar Sesión',
  'app.logging.out': 'Cerrando sesión...',

  // Navigation
  'nav.dashboard': 'Panel',
  'nav.cafes': 'Cafeterías',
  'nav.kpi.settings': 'Configuración KPI',
  'nav.admin.panel': 'Panel de Administración',
  'nav.user.management': 'Gestión de Usuarios',

  // Dashboard
  'dashboard.title': 'Panel',
  'dashboard.admin.subtitle': 'Monitorear rendimiento y métricas del equipo',
  'dashboard.user.subtitle': 'Monitorear tu rendimiento y métricas de salario',
  'dashboard.overview': 'Resumen',
  'dashboard.deletion.history': 'Historial de Eliminación',
  'dashboard.performance': 'Rendimiento',
  'dashboard.summary': 'Resumen',
  'dashboard.all.users': 'Todos los Usuarios',
  
  // Salary Cards
  'salary.basic': 'Salario Básico',
  'salary.kpi': 'Salario KPI',
  'salary.total': 'Salario Total',
  'salary.of.total.package': 'del paquete total',
  'salary.including': 'Incluyendo',
  'salary.in.bonuses': 'en bonificaciones',

  // KPI Stats
  'kpi.visit.status': 'Estado KPI de Visitas',
  'kpi.contract.status': 'Estado KPI de Contratos',
  'kpi.progress': 'Progreso',
  'kpi.threshold': 'Umbral',
  'kpi.large': 'Grande',
  'kpi.medium': 'Mediano',
  'kpi.small': 'Pequeño',
  'kpi.under.negotiation': 'En Negociación',
  'kpi.total': 'Total',

  // Bonus
  'bonus.contract': 'Bono de Contrato',
  'bonus.large.cafes': 'Cafeterías Grandes',
  'bonus.medium.cafes': 'Cafeterías Medianas',
  'bonus.small.cafes': 'Cafeterías Pequeñas',
  'bonus.per.cafe': 'por cafetería',
  'bonus.total': 'Bono Total',
  'bonus.contracted.cafes': 'cafeterías contratadas',

  // Cafe Management
  'cafe.management.title': 'Gestión de Cafeterías',
  'cafe.management.subtitle': 'Añadir y gestionar información de cafeterías',
  'cafe.my.cafes': 'Mis Cafeterías',
  'cafe.list': 'Lista de cafeterías en el sistema',
  'cafe.database': 'Base de Datos de Cafeterías',
  'cafe.all': 'Todas las cafeterías en el sistema',
  'cafe.name': 'Nombre',
  'cafe.size': 'Tamaño',
  'cafe.location': 'Ubicación',
  'cafe.status': 'Estado',
  'cafe.owner': 'Propietario',
  'cafe.created.by': 'Creado Por',
  'cafe.date.added': 'Fecha de Adición',
  'cafe.actions': 'Acciones',
  'cafe.no.cafes': 'No se encontraron cafeterías. Añade algunas para verlas aquí.',
  'cafe.refresh.data': 'Actualizar Datos',
  'cafe.refreshing': 'Actualizando...',
  'cafe.force.refresh': 'Forzar Actualización',
  'cafe.found': 'cafeterías encontradas',
  'cafe.loading': 'Cargando datos de cafeterías...',
  'cafe.mark.visited': 'Marcar Visitada',
  'cafe.mark.contracted': 'Marcar Contratada',
  'cafe.deleting': 'Eliminando...',
  'cafe.negotiation.warning': 'Las cafeterías en negociación (0 pipas) no pueden marcarse como contratadas',
  'cafe.photo': 'Foto de Cafetería',
  'cafe.gps.note': 'Nota: La ubicación GPS no se puede cambiar después de la creación de la cafetería.',
  'cafe.saving': 'Guardando...',

  // Cafe Form Fields
  'cafe.form.cafe.name': 'Nombre de Cafetería',
  'cafe.form.owner.name': 'Nombre del Propietario',
  'cafe.form.owner.phone': 'Número de Teléfono del Propietario',
  'cafe.form.cafe.status': 'Estado de Cafetería',
  'cafe.form.hookahs': 'Número de Pipas',
  'cafe.form.tables': 'Número de Mesas',
  'cafe.form.governorate': 'Gobernación',
  'cafe.form.city': 'Ciudad',
  'cafe.form.select.governorate': 'Seleccionar gobernación',
  'cafe.form.select.city': 'Seleccionar ciudad',
  'cafe.form.select.governorate.first': 'Seleccionar gobernación primero',
  'cafe.form.photo': 'Foto de Cafetería',
  'cafe.form.gps': 'Ubicación GPS',
  'cafe.form.required': 'requerido',
  'cafe.form.gps.note': 'La ubicación GPS no se puede cambiar después de la creación de la cafetería.',
  'cafe.form.size.current': 'Tamaño Actual',
  'cafe.form.size.legend': '1-3 pipas: Pequeño | 4-7 pipas: Mediano | 7+ pipas: Grande | 0 pipas: En Negociación',

  // Brand Survey
  'survey.title': 'Encuesta de Ventas de Marcas',
  'survey.select.brands': 'Seleccione las marcas vendidas en esta cafetería:',
  'survey.weekly.sales': 'Ventas semanales por marca:',
  'survey.packs.per.week': 'paquetes por semana',
  'survey.submit': 'Enviar Encuesta',
  'survey.submitting': 'Enviando...',
  'survey.cancel': 'Cancelar',

  // Deletion Logs
  'deletion.logs.title': 'Registros de Eliminación',
  'deletion.logs.subtitle': 'Historial de elementos eliminados',
  'deletion.entity.type': 'Tipo de Entidad',
  'deletion.deleted.at': 'Eliminado El',
  'deletion.deleted.by': 'Eliminado Por',
  'deletion.entity.info': 'Información de Entidad',
  'deletion.no.logs': 'No se encontraron registros de eliminación',
  'deletion.loading': 'Cargando...',
  'deletion.refresh': 'Actualizar',

  // User Management
  'user.list': 'Lista de Usuarios',
  'user.registered': 'Usuarios registrados en el sistema',
  'user.name': 'Nombre',
  'user.role': 'Rol',
  'user.no.users': 'No se encontraron usuarios. Añade algunos para verlos aquí.',
  
  // Buttons & Actions
  'button.edit': 'Editar',
  'button.delete': 'Eliminar',
  'button.save': 'Guardar Cambios',
  'button.cancel': 'Cancelar',
  'button.refresh': 'Actualizar',
};

export default translations;
