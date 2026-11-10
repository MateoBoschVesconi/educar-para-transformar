import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { 
  generarHtmlCertificado, 
  generarHtmlReciboPago, 
  descargarOImprimirPDF 
} from '../utils/pdf-documents';

interface CuotaAlumno {
  id: number;
  mes: string;
  monto: number;
  estado: 'Pagada' | 'Pendiente' | 'Vencida';
  fecha_vencimiento?: string;
  fecha_pago?: string;
  metodo_pago?: string;
}

interface Actividad {
  id: string;
  tipo: 'deporte' | 'idioma';
  nombre: string;
  icono: string;
  horario: string;
  dias: string;
  profesor: string;
  cupos: string;
}

const ACTIVIDADES_DISPONIBLES: Actividad[] = [
  // Idiomas
  { id: 'idioma-en', tipo: 'idioma', nombre: 'Inglés Cambridge B1/B2', icono: '🇬🇧', dias: 'Martes y Jueves', horario: '17:30 a 19:00 hs', profesor: 'Prof. Helen Smith', cupos: 'Cupos disponibles' },
  { id: 'idioma-pt', tipo: 'idioma', nombre: 'Portugués Conversacional', icono: '🇧🇷', dias: 'Lunes y Miércoles', horario: '18:00 a 19:30 hs', profesor: 'Prof. Tiago Silva', cupos: 'Cupos disponibles' },
  { id: 'idioma-fr', tipo: 'idioma', nombre: 'Francés Inicial & Cultural', icono: '🇫🇷', dias: 'Viernes', horario: '16:30 a 18:30 hs', profesor: 'Mme. Claire Dupont', cupos: 'Últimos 3 cupos' },
  { id: 'idioma-it', tipo: 'idioma', nombre: 'Italiano Comunicativo', icono: '🇮🇹', dias: 'Jueves', horario: '17:00 a 19:00 hs', profesor: 'Prof. Marco Rossi', cupos: 'Cupos disponibles' },
  { id: 'idioma-de', tipo: 'idioma', nombre: 'Alemán Básico & Gramática', icono: '🇩🇪', dias: 'Miércoles', horario: '16:00 a 18:00 hs', profesor: 'Prof. Hans Weber', cupos: 'Cupos disponibles' },

  // Deportes
  { id: 'dep-fut', tipo: 'deporte', nombre: 'Fútbol Formativo Mixto', icono: '⚽', dias: 'Lunes y Miércoles', horario: '17:00 a 18:30 hs', profesor: 'DT. Diego Romero', cupos: 'Cupos disponibles' },
  { id: 'dep-bas', tipo: 'deporte', nombre: 'Básquetbol Juvenil', icono: '🏀', dias: 'Martes y Jueves', horario: '18:00 a 19:30 hs', profesor: 'Prof. Emanuel Ginóbili Jr.', cupos: 'Cupos disponibles' },
  { id: 'dep-vol', tipo: 'deporte', nombre: 'Vóley Institucional', icono: '🏐', dias: 'Lunes y Viernes', horario: '16:30 a 18:00 hs', profesor: 'Prof. Paula Conte', cupos: 'Cupos disponibles' },
  { id: 'dep-nat', tipo: 'deporte', nombre: 'Natación y Acondicionamiento', icono: '🏊', dias: 'Sábados', horario: '10:00 a 12:00 hs', profesor: 'Entrenador Facundo Díaz', cupos: 'Últimos 2 cupos' },
  { id: 'dep-aje', tipo: 'deporte', nombre: 'Club de Ajedrez & Lógica', icono: '♟️', dias: 'Viernes', horario: '17:30 a 19:00 hs', profesor: 'Maestro FIDE Marcelo Gómez', cupos: 'Cupos disponibles' },
];

export default function Dashboard() {
  const router = useRouter();

  // Estados de navegación interna del panel
  const [activeTab, setActiveTab] = useState<'inicio' | 'cuotas' | 'actividades'>('inicio');
  const [email, setEmail] = useState('Cargando...');
  const [nombreAlumno, setNombreAlumno] = useState('Estudiante');
  const [documento, setDocumento] = useState('44123456');

  // Estado de Cuotas del Alumno
  const [cuotas, setCuotas] = useState<CuotaAlumno[]>([
    { id: 1, mes: 'Noviembre 2026', monto: 45000, estado: 'Pendiente', fecha_vencimiento: '2026-11-15' },
    { id: 2, mes: 'Octubre 2026', monto: 42000, estado: 'Pagada', fecha_pago: '2026-10-10', metodo_pago: 'Transferencia Bancaria' },
    { id: 3, mes: 'Septiembre 2026', monto: 42000, estado: 'Pagada', fecha_pago: '2026-09-08', metodo_pago: 'Mercado Pago' },
    { id: 4, mes: 'Diciembre 2026', monto: 45000, estado: 'Pendiente', fecha_vencimiento: '2026-12-15' },
  ]);

  // Actividades inscriptas por el alumno (IDs)
  const [actividadesInscriptas, setActividadesInscriptas] = useState<string[]>(['idioma-en', 'dep-fut']);
  const [filtroTipoActividad, setFiltroTipoActividad] = useState<'todos' | 'deporte' | 'idioma'>('todos');

  // Cargar sesión del alumno y sus datos reales desde Supabase
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userEmail = session.user.email || '';
        setEmail(userEmail);

        try {
          // 1. Consultar si el alumno existe en la tabla alumnos
          const { data: alumnoDb } = await supabase
            .from('alumnos')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();

          let dniFinal = '44123456';
          if (alumnoDb) {
            setNombreAlumno(alumnoDb.nombre);
            setDocumento(alumnoDb.dni);
            dniFinal = alumnoDb.dni;
          } else {
            const meta = session.user.user_metadata || {};
            if (meta.nombre) setNombreAlumno(meta.nombre);
            if (meta.dni) {
              setDocumento(meta.dni);
              dniFinal = meta.dni;
            } else {
              const partes = userEmail.split('@')[0];
              const formateado = partes.charAt(0).toUpperCase() + partes.slice(1);
              setNombreAlumno(formateado || 'Estudiante');
            }
          }

          // 2. Consultar cuotas registradas para este alumno
          const { data: cuotasDb } = await supabase
            .from('cuotas')
            .select('*')
            .eq('alumno_dni', dniFinal)
            .order('id', { ascending: true });

          if (cuotasDb && cuotasDb.length > 0) {
            setCuotas(cuotasDb as CuotaAlumno[]);
          }
        } catch (dbErr) {
          console.warn('Aviso cargando datos de alumno en Supabase:', dbErr);
        }
      } else {
        router.replace('/');
      }
    }).catch((err) => {
      console.error(err);
      router.replace('/');
    });
  }, [router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    } else {
      router.replace('/');
    }
  };

  // 1. Descarga/Emisión de Certificado de Alumno Regular (documento limpio en PDF)
  const handleGenerateCertificate = async () => {
    if (!documento.trim()) {
      Alert.alert('Error', 'Por favor ingresá tu documento o legajo.');
      return;
    }

    try {
      const html = generarHtmlCertificado({
        nombreAlumno,
        documento: documento.trim(),
        nivel: 'Nivel Secundario'
      });

      await descargarOImprimirPDF(html, 'Certificado_Alumno_Regular');
      Alert.alert('Éxito', 'El Certificado de Alumno Regular fue generado en formato oficial PDF.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un problema al generar el certificado.');
    }
  };

  // 2. Notificar / Pagar Cuota desde el Panel del Alumno
  const handlePagarCuotaAlumno = async (cuota: CuotaAlumno) => {
    const fechaHoy = new Date().toISOString().split('T')[0];

    // Actualizar en estado local
    setCuotas(prev => prev.map(c => {
      if (c.id === cuota.id) {
        return {
          ...c,
          estado: 'Pagada',
          fecha_pago: fechaHoy,
          metodo_pago: 'Transferencia Bancaria / App Alumno'
        };
      }
      return c;
    }));

    Alert.alert(
      '¡Pago Notificado con Éxito!',
      `Se registró el pago de la cuota ${cuota.mes}. Ya puedes descargar tu Recibo Oficial en PDF.`,
      [
        { text: 'Aceptar' },
        { 
          text: 'Descargar Recibo PDF', 
          onPress: () => handleDescargarReciboAlumno({
            ...cuota,
            estado: 'Pagada',
            fecha_pago: fechaHoy,
            metodo_pago: 'Transferencia Bancaria / App Alumno'
          })
        }
      ]
    );
  };

  // 3. Descargar Recibo Oficial en PDF
  const handleDescargarReciboAlumno = async (cuota: CuotaAlumno) => {
    try {
      const html = generarHtmlReciboPago({
        id: cuota.id,
        alumnoNombre: nombreAlumno,
        alumnoDni: documento,
        mes: cuota.mes,
        monto: cuota.monto,
        fechaPago: cuota.fecha_pago,
        metodoPago: cuota.metodo_pago || 'Transferencia Bancaria'
      });

      await descargarOImprimirPDF(html, `Recibo_Cuota_${cuota.mes.replace(/\s+/g, '_')}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo generar el recibo PDF.');
    }
  };

  // 4. Inscripción / Desinscripción a Deportes e Idiomas
  const toggleInscripcionActividad = (actividad: Actividad) => {
    const isInscripto = actividadesInscriptas.includes(actividad.id);

    if (isInscripto) {
      Alert.alert(
        'Cancelar Inscripción',
        `¿Deseas darte de baja de la actividad "${actividad.nombre}"?`,
        [
          { text: 'Volver', style: 'cancel' },
          {
            text: 'Confirmar Baja',
            style: 'destructive',
            onPress: () => {
              setActividadesInscriptas(prev => prev.filter(id => id !== actividad.id));
              Alert.alert('Baja confirmada', `Te has desinscripto de ${actividad.nombre}.`);
            }
          }
        ]
      );
    } else {
      setActividadesInscriptas(prev => [...prev, actividad.id]);
      Alert.alert(
        '¡Inscripción Exitosa! 🎓',
        `Te has inscripto correctamente en "${actividad.nombre}". Días: ${actividad.dias} en el horario de ${actividad.horario}.`
      );
    }
  };

  // Filtro de actividades
  const actividadesFiltradas = useMemo(() => {
    if (filtroTipoActividad === 'todos') return ACTIVIDADES_DISPONIBLES;
    return ACTIVIDADES_DISPONIBLES.filter(a => a.tipo === filtroTipoActividad);
  }, [filtroTipoActividad]);

  // Cuotas pendientes y pagadas
  const cuotasPendientes = useMemo(() => cuotas.filter(c => c.estado !== 'Pagada'), [cuotas]);
  const cuotasPagadas = useMemo(() => cuotas.filter(c => c.estado === 'Pagada'), [cuotas]);

  return (
    <SafeAreaView className="flex-1 bg-slate-100 flex-col md:flex-row">
      
      {/* SIDEBAR LATERAL (DESKTOP) */}
      <View className="w-full md:w-64 bg-blue-900 flex-col justify-between p-6 shadow-xl">
        <View>
          <View className="mb-6 flex-row md:flex-col items-center gap-3">
            <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center border border-white/20">
              <Text className="text-white text-xl">🎓</Text>
            </View>
            <View className="flex-1 md:items-center">
              <Text className="text-white font-black uppercase text-sm tracking-wider">Educar Para Transformar</Text>
              <Text className="text-[10px] text-blue-300 font-bold uppercase">Portal del Estudiante</Text>
              <Text className="text-[10px] text-blue-200 mt-0.5 truncate">{email}</Text>
            </View>
          </View>

          <View className="gap-2">
            <TouchableOpacity 
              onPress={() => setActiveTab('inicio')}
              className={`flex-row items-center gap-3 p-3 rounded-xl ${activeTab === 'inicio' ? 'bg-blue-800' : 'hover:bg-blue-800/60'}`}
            >
              <Text className="text-white text-sm">🏠</Text>
              <Text className="font-bold text-xs uppercase tracking-wider text-white">Inicio & Certificado</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('cuotas')}
              className={`flex-row items-center justify-between p-3 rounded-xl ${activeTab === 'cuotas' ? 'bg-blue-800' : 'hover:bg-blue-800/60'}`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-sm">💳</Text>
                <Text className="font-bold text-xs uppercase tracking-wider text-white">Mis Cuotas y Pagos</Text>
              </View>
              {cuotasPendientes.length > 0 && (
                <View className="bg-amber-500 px-2 py-0.5 rounded-full">
                  <Text className="text-slate-900 text-[9px] font-black">{cuotasPendientes.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('actividades')}
              className={`flex-row items-center justify-between p-3 rounded-xl ${activeTab === 'actividades' ? 'bg-blue-800' : 'hover:bg-blue-800/60'}`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-sm">⚽</Text>
                <Text className="font-bold text-xs uppercase tracking-wider text-white">Deportes e Idiomas</Text>
              </View>
              <View className="bg-emerald-500 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[9px] font-black">{actividadesInscriptas.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/devops-qa' as any)}
              className="flex-row items-center gap-3 p-3 rounded-xl bg-orange-600 hover:bg-orange-500 mt-2 shadow-sm"
            >
              <Text className="text-white text-sm">🧪</Text>
              <Text className="font-black text-xs uppercase tracking-wider text-white">DevOps & QA (U4/U5)</Text>
            </TouchableOpacity>

            {email.toLowerCase() === 'admin@educar.com' && (
              <TouchableOpacity 
                onPress={() => router.push('/admin' as any)}
                className="flex-row items-center gap-3 p-3 rounded-xl bg-amber-600 hover:bg-amber-500 mt-2 shadow-sm"
              >
                <Text className="text-white text-sm">🛡️</Text>
                <Text className="font-black text-xs uppercase tracking-wider text-white">Panel Administrador</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-red-600/90 hover:bg-red-600 p-3 rounded-xl flex-row items-center justify-center gap-2 mt-6"
        >
          <Text className="text-white">🚪</Text>
          <Text className="font-black uppercase text-xs tracking-widest text-white">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <View className="flex-1 p-4 md:p-8">
        
        {/* MOBILE BACK BUTTON */}
        <View className="md:hidden mb-4 flex-row justify-between items-center">
          <Link href="/" asChild>
            <TouchableOpacity className="flex-row items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm">
              <Text className="text-slate-600 text-xs">⬅️</Text>
              <Text className="font-bold text-xs uppercase tracking-wider text-slate-600">Volver al inicio</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* HEADER DE BIENVENIDA */}
        <View className="flex-row justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm">
          <View className="flex-1 pr-4">
            <Text className="text-xl md:text-2xl font-black text-slate-800">¡Hola, {nombreAlumno}!</Text>
            <Text className="text-xs font-bold text-slate-400 mt-1">
              Ciclo Lectivo 2026/2027 • Cuenta Estudiante: {email}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-blue-100 items-center justify-center shadow-sm">
            <Text className="text-blue-900 font-black text-lg">{email.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* ---------------- PESTAÑA 1: INICIO & CERTIFICADO DE ALUMNO REGULAR ---------------- */}
        {activeTab === 'inicio' && (
          <ScrollView className="flex-1">
            {/* Métricas del Estudiante */}
            <View className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-600">
                <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado Académico</Text>
                <Text className="text-2xl font-black text-slate-800 mt-1">Regular</Text>
                <Text className="text-[10px] text-blue-600 font-bold mt-1">Matrícula confirmada</Text>
              </View>

              <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-emerald-500">
                <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cuotas del Ciclo</Text>
                <Text className="text-2xl font-black text-emerald-700 mt-1">{cuotasPagadas.length} al día</Text>
                <Text className="text-[10px] text-slate-500 mt-1">{cuotasPendientes.length} cuota(s) pendiente(s)</Text>
              </View>

              <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-amber-500">
                <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Actividades Extracurriculares</Text>
                <Text className="text-2xl font-black text-slate-800 mt-1">{actividadesInscriptas.length} Inscriptas</Text>
                <Text className="text-[10px] text-amber-600 font-bold mt-1">Deportes e Idiomas</Text>
              </View>
            </View>

            {/* SECCIÓN CERTIFICADO DE ALUMNO REGULAR (DESCARGA PDF REAL) */}
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-slate-200">
              <View className="flex-row items-center gap-3 mb-2">
                <Text className="text-xl">📜</Text>
                <Text className="font-black text-slate-800 uppercase text-sm tracking-wider">
                  Certificado de Alumno Regular (Descarga Oficial PDF)
                </Text>
              </View>
              <Text className="text-slate-500 text-xs mb-4 leading-relaxed">
                Ingresá o confirmá tu DNI / legajo para descargar tu certificado oficial en formato PDF, con firmas digitales institucionales y código de verificación, listo para presentar ante autoridades.
              </Text>
              
              <View className="flex-col md:flex-row gap-4">
                <TextInput
                  className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold"
                  placeholder="N° de Documento o Legajo (ej. 44.123.456)"
                  value={documento}
                  onChangeText={setDocumento}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={handleGenerateCertificate}
                  className="bg-blue-900 hover:bg-blue-800 px-8 py-4 rounded-xl justify-center items-center shadow-lg flex-row gap-2"
                >
                  <Text className="text-white text-xs">📄</Text>
                  <Text className="text-white font-black uppercase text-xs tracking-widest">Generar PDF</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Circular Informativa */}
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <Text className="font-black text-slate-800 uppercase text-xs tracking-wider mb-3">Circular Informativa del Ciclo Lectivo</Text>
              <View className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Text className="text-slate-600 text-xs leading-relaxed">
                  Estimado estudiante y familia, les informamos que ya se encuentran abiertas las inscripciones para las <Text className="font-bold text-blue-900">clases de idiomas y talleres deportivos extracurriculares</Text> desde la pestaña correspondiente. Además, pueden regularizar y descargar sus recibos oficiales de cuotas escolares de manera 100% digital.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- PESTAÑA 2: GESTIÓN DE CUOTAS Y RECIBOS ---------------- */}
        {activeTab === 'cuotas' && (
          <ScrollView className="flex-1">
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-slate-200">
              <View className="flex-row justify-between items-center mb-4">
                <div>
                  <Text className="text-base font-black text-slate-800 uppercase tracking-wider">Estado de Mis Cuotas Escolares</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Podés notificar pagos realizados y descargar los comprobantes oficiales en PDF.</Text>
                </div>
                <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <Text className="text-blue-900 font-bold text-xs">{cuotasPendientes.length} Pendiente(s)</Text>
                </View>
              </View>

              {/* LISTADO DE CUOTAS */}
              <View className="gap-3">
                {cuotas.map((cuota) => (
                  <View 
                    key={cuota.id}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-blue-300 transition-all"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-3">
                        <Text className="font-black text-slate-800 text-base">{cuota.mes}</Text>
                        <View className={`px-2.5 py-0.5 rounded-full ${
                          cuota.estado === 'Pagada' ? 'bg-emerald-100' :
                          cuota.estado === 'Pendiente' ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                          <Text className={`text-[10px] font-black uppercase ${
                            cuota.estado === 'Pagada' ? 'text-emerald-800' :
                            cuota.estado === 'Pendiente' ? 'text-amber-800' : 'text-red-800'
                          }`}>
                            ● {cuota.estado}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <Text className="text-xs font-bold text-blue-900">Monto: ${cuota.monto.toLocaleString('es-AR')}</Text>
                        {cuota.fecha_vencimiento && cuota.estado !== 'Pagada' && (
                          <Text className="text-xs text-amber-600">Vence: {cuota.fecha_vencimiento}</Text>
                        )}
                        {cuota.fecha_pago && (
                          <Text className="text-xs text-emerald-700 font-semibold">
                            Pagado el: {cuota.fecha_pago} ({cuota.metodo_pago || 'Transferencia'})
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* BOTONES DE ACCIÓN */}
                    <View className="flex-row gap-2 self-end md:self-center">
                      {cuota.estado !== 'Pagada' ? (
                        <TouchableOpacity
                          onPress={() => handlePagarCuotaAlumno(cuota)}
                          className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl flex-row items-center gap-2 shadow-sm"
                        >
                          <Text className="text-white text-xs">💰</Text>
                          <Text className="text-white font-black text-xs uppercase tracking-wider">
                            Pagar / Notificar Pago
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleDescargarReciboAlumno(cuota)}
                          className="bg-blue-900 hover:bg-blue-800 px-4 py-2.5 rounded-xl flex-row items-center gap-2 shadow-sm"
                        >
                          <Text className="text-white text-xs">📄</Text>
                          <Text className="text-white font-black text-xs uppercase tracking-wider">
                            Descargar Recibo PDF
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ---------------- PESTAÑA 3: INSCRIPCIÓN A DEPORTES E IDIOMAS ---------------- */}
        {activeTab === 'actividades' && (
          <ScrollView className="flex-1">
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-slate-200">
              <View className="flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <Text className="text-base font-black text-slate-800 uppercase tracking-wider">
                    Talleres Deportivos y Clases de Idiomas
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Podés sumarte a las disciplinas institucionales sin costo adicional.
                  </Text>
                </div>

                {/* Filtro por categoría */}
                <View className="flex-row gap-2">
                  {[
                    { id: 'todos', label: 'Todas' },
                    { id: 'idioma', label: 'Idiomas 🇬🇧' },
                    { id: 'deporte', label: 'Deportes ⚽' },
                  ].map(tab => (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setFiltroTipoActividad(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold ${
                        filtroTipoActividad === tab.id ? 'bg-blue-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${filtroTipoActividad === tab.id ? 'text-white' : 'text-slate-600'}`}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* LISTA DE ACTIVIDADES EN FORMATO GRID / TARJETAS */}
              <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actividadesFiltradas.map((act) => {
                  const inscripto = actividadesInscriptas.includes(act.id);

                  return (
                    <View 
                      key={act.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        inscripto 
                          ? 'bg-blue-50/70 border-blue-400 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center gap-3">
                          <Text className="text-3xl">{act.icono}</Text>
                          <View>
                            <Text className="font-black text-slate-800 text-sm">{act.nombre}</Text>
                            <Text className="text-[10px] text-slate-500 font-semibold">{act.profesor}</Text>
                          </View>
                        </View>
                        {inscripto && (
                          <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <Text className="text-emerald-800 text-[10px] font-black uppercase">Inscripto ✓</Text>
                          </View>
                        )}
                      </View>

                      <View className="bg-white/80 p-3 rounded-xl border border-slate-200/60 mb-4 gap-1">
                        <Text className="text-xs text-slate-700">
                          📅 <strong>Días:</strong> {act.dias}
                        </Text>
                        <Text className="text-xs text-slate-700">
                          ⏰ <strong>Horario:</strong> {act.horario}
                        </Text>
                        <Text className="text-[10px] text-orange-600 font-bold mt-0.5">
                          📌 {act.cupos}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => toggleInscripcionActividad(act)}
                        className={`w-full py-3 rounded-xl flex-row items-center justify-center gap-2 shadow-sm ${
                          inscripto
                            ? 'bg-slate-200 hover:bg-red-50 border border-slate-300'
                            : 'bg-blue-900 hover:bg-blue-800'
                        }`}
                      >
                        <Text className={`text-xs font-black uppercase tracking-wider ${
                          inscripto ? 'text-slate-700' : 'text-white'
                        }`}>
                          {inscripto ? '✕ Cancelar Inscripción' : '✓ Inscribirme a esta clase'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );
}
