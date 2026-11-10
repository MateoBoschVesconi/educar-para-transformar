import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface Inscripcion {
  id: number;
  created_at: string;
  nombre: string;
  dni: string;
  nivel: string;
  email: string;
  mensaje: string;
}

interface Alumno {
  id?: number;
  nombre: string;
  dni: string;
  nivel: string;
  email: string;
  estado: string; // 'Regular' | 'Condicional' | 'Becado'
}

interface Cuota {
  id?: number;
  alumno_dni: string;
  alumno_nombre: string;
  mes: string;
  monto: number;
  estado: 'Pagada' | 'Pendiente' | 'Vencida';
  fecha_vencimiento?: string;
  fecha_pago?: string;
  metodo_pago?: string;
}

function generarHtmlRecibo(cuota: Cuota): string {
  const reciboNum = cuota.id ? String(cuota.id) : cuota.alumno_dni.slice(-4);
  const fechaHoy = new Date().toLocaleDateString('es-AR');
  const fechaPagoMostrar = cuota.fecha_pago || fechaHoy;

  return `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 40px; color: #1e293b;">
        <div style="border: 2px solid #1e3a8a; border-radius: 12px; padding: 30px; max-width: 650px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
            <div>
              <h1 style="color: #1e3a8a; margin: 0; font-size: 22px;">CENTRO EDUCATIVO EDUCAR PARA TRANSFORMAR</h1>
              <p style="margin: 4px 0 0; color: #ea580c; font-weight: bold; font-size: 13px;">COMPROBANTE OFICIAL DE PAGO DE CUOTA</p>
            </div>
          </div>

          <div style="margin-top: 25px; background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p style="margin: 6px 0;"><strong>Recibo N°:</strong> #REC-${reciboNum}</p>
            <p style="margin: 6px 0;"><strong>Fecha de Pago:</strong> ${fechaPagoMostrar}</p>
            <p style="margin: 6px 0;"><strong>Alumno:</strong> ${cuota.alumno_nombre}</p>
            <p style="margin: 6px 0;"><strong>DNI / Legajo:</strong> ${cuota.alumno_dni}</p>
            <p style="margin: 6px 0;"><strong>Concepto:</strong> Cuota escolar - ${cuota.mes}</p>
            <p style="margin: 6px 0;"><strong>Método de Pago:</strong> ${cuota.metodo_pago || 'Transferencia Bancaria'}</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-size: 20px; color: #1e3a8a;">
              <strong>Monto Abonado:</strong> $${cuota.monto.toLocaleString('es-AR')}
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 11px;">
            <p>Este comprobante certifica la regularización del período indicado. Emitido electrónicamente por el Departamento de Administración y Finanzas.</p>
            <p>Resistencia, Chaco — Ciclo Lectivo 2026/2027</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default function AdminDashboard() {
  const router = useRouter();

  // Estados de autenticación y carga
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'inscripciones' | 'cuotas' | 'alumnos' | 'sql'>('inscripciones');
  const [loading, setLoading] = useState(false);

  // Datos principales
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);

  // Búsqueda y filtros
  const [searchInscripcion, setSearchInscripcion] = useState('');
  const [nivelFilter, setNivelFilter] = useState('Todos');
  const [searchCuota, setSearchCuota] = useState('');
  const [estadoCuotaFilter, setEstadoCuotaFilter] = useState('Todos');

  // Modales
  const [selectedInscripcion, setSelectedInscripcion] = useState<Inscripcion | null>(null);
  const [modalInscripcionVisible, setModalInscripcionVisible] = useState(false);
  
  // Modal Nueva Cuota
  const [modalNuevaCuotaVisible, setModalNuevaCuotaVisible] = useState(false);
  const [cuotaDni, setCuotaDni] = useState('');
  const [cuotaNombre, setCuotaNombre] = useState('');
  const [cuotaMes, setCuotaMes] = useState('Noviembre 2026');
  const [cuotaMonto, setCuotaMonto] = useState('45000');

  // Modal Registrar Pago
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [cuotaSeleccionadaPago, setCuotaSeleccionadaPago] = useState<Cuota | null>(null);
  const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');

  // Modal Nuevo Alumno
  const [modalNuevoAlumnoVisible, setModalNuevoAlumnoVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoNivel, setNuevoNivel] = useState('Nivel Inicial');
  const [nuevoEmail, setNuevoEmail] = useState('');

  // Estado de persistencia de tablas en Supabase
  const [hasSupabaseAlumnos, setHasSupabaseAlumnos] = useState(false);
  const [hasSupabaseCuotas, setHasSupabaseCuotas] = useState(false);

  // Carga de datos
  const fetchInscripciones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inscripciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando inscripciones:', error);
      } else if (data) {
        setInscripciones(data as Inscripcion[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAlumnos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        setHasSupabaseAlumnos(false);
        setAlumnos(prev => (prev.length === 0 ? [
          { id: 1, nombre: 'Valentina Morales', dni: '45123987', nivel: 'Nivel Secundario', email: 'vmorales@tutor.com', estado: 'Regular' },
          { id: 2, nombre: 'Santiago Benítez', dni: '46234123', nivel: 'Nivel Primario', email: 'sbenitez@tutor.com', estado: 'Regular' },
          { id: 3, nombre: 'Lucía Fernández', dni: '48345678', nivel: 'Nivel Inicial', email: 'lfernandez@tutor.com', estado: 'Becado' },
        ] : prev));
      } else if (data) {
        setHasSupabaseAlumnos(true);
        setAlumnos(data as Alumno[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCuotas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cuotas')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        setHasSupabaseCuotas(false);
        setCuotas(prev => (prev.length === 0 ? [
          { id: 101, alumno_dni: '45123987', alumno_nombre: 'Valentina Morales', mes: 'Noviembre 2026', monto: 45000, estado: 'Pendiente', fecha_vencimiento: '2026-11-15' },
          { id: 102, alumno_dni: '46234123', alumno_nombre: 'Santiago Benítez', mes: 'Noviembre 2026', monto: 45000, estado: 'Pagada', fecha_pago: '2026-11-05', metodo_pago: 'Transferencia Bancaria' },
          { id: 103, alumno_dni: '45123987', alumno_nombre: 'Valentina Morales', mes: 'Octubre 2026', monto: 42000, estado: 'Pagada', fecha_pago: '2026-10-10', metodo_pago: 'Efectivo' },
          { id: 104, alumno_dni: '48345678', alumno_nombre: 'Lucía Fernández', mes: 'Noviembre 2026', monto: 22500, estado: 'Vencida', fecha_vencimiento: '2026-11-08' },
        ] : prev));
      } else if (data) {
        setHasSupabaseCuotas(true);
        setCuotas(data as Cuota[]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchInscripciones(),
      fetchAlumnos(),
      fetchCuotas(),
    ]);
    setLoading(false);
  }, [fetchInscripciones, fetchAlumnos, fetchCuotas]);

  // 1. Control de Acceso: solo admin@educar.com
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          Alert.alert('Acceso restringido', 'Debes iniciar sesión para acceder al panel de administración.');
          router.replace('/');
          return;
        }

        const userEmail = (session.user.email || '').toLowerCase().trim();
        if (userEmail !== 'admin@educar.com') {
          Alert.alert('Acceso Denegado', 'Esta sección es exclusiva para el administrador del sistema.');
          router.replace('/dashboard');
          return;
        }

        setAdminEmail(userEmail);
        setCheckingAuth(false);
        loadAllData();
      } catch (err) {
        console.error('Error verificando sesión admin:', err);
        router.replace('/');
      }
    };

    verifyAdmin();
  }, [router, loadAllData]);

  // 3. Cerrar sesión
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // 4. Acciones sobre Inscripciones
  const handleAprobarInscripcion = async (inscripcion: Inscripcion) => {
    Alert.alert(
      'Aceptar e Inscribir Alumno',
      `¿Deseas dar de alta como alumno regular a ${inscripcion.nombre} (DNI: ${inscripcion.dni}) y generar su primera cuota?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Alta',
          onPress: async () => {
            const nuevoAlumno: Alumno = {
              nombre: inscripcion.nombre,
              dni: inscripcion.dni,
              nivel: inscripcion.nivel,
              email: inscripcion.email,
              estado: 'Regular'
            };

            const nuevaCuota: Cuota = {
              alumno_dni: inscripcion.dni,
              alumno_nombre: inscripcion.nombre,
              mes: 'Matrícula 2027',
              monto: 50000,
              estado: 'Pendiente',
              fecha_vencimiento: '2026-12-10'
            };

            // Intentar persistir en Supabase si existen las tablas
            if (hasSupabaseAlumnos) {
              await supabase.from('alumnos').insert([nuevoAlumno]);
            }
            if (hasSupabaseCuotas) {
              await supabase.from('cuotas').insert([nuevaCuota]);
            }

            // Actualizar estado local
            setAlumnos(prev => [nuevoAlumno, ...prev]);
            setCuotas(prev => [nuevaCuota, ...prev]);

            setModalInscripcionVisible(false);
            Alert.alert('¡Alumno Inscripto!', `${inscripcion.nombre} fue añadido al padrón de alumnos y se generó su matrícula.`);
          }
        }
      ]
    );
  };

  const handleEliminarInscripcion = async (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar Solicitud',
      `¿Estás seguro de eliminar la solicitud de ${nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('inscripciones')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', 'No se pudo eliminar la solicitud de Supabase.');
              console.error(error);
            } else {
              setInscripciones(prev => prev.filter(item => item.id !== id));
              setModalInscripcionVisible(false);
              Alert.alert('Eliminada', 'La solicitud ha sido eliminada con éxito.');
            }
          }
        }
      ]
    );
  };

  // 5. Acciones sobre Cuotas
  const handleCrearCuota = async () => {
    if (!cuotaDni.trim() || !cuotaNombre.trim() || !cuotaMonto.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresá DNI, Nombre y Monto de la cuota.');
      return;
    }

    const nueva: Cuota = {
      alumno_dni: cuotaDni.trim(),
      alumno_nombre: cuotaNombre.trim(),
      mes: cuotaMes,
      monto: parseFloat(cuotaMonto) || 45000,
      estado: 'Pendiente',
      fecha_vencimiento: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
    };

    if (hasSupabaseCuotas) {
      const { data, error } = await supabase.from('cuotas').insert([nueva]).select();
      if (!error && data) {
        setCuotas(prev => [data[0] as Cuota, ...prev]);
      } else {
        setCuotas(prev => [{ ...nueva, id: Date.now() }, ...prev]);
      }
    } else {
      setCuotas(prev => [{ ...nueva, id: Date.now() }, ...prev]);
    }

    setCuotaDni('');
    setCuotaNombre('');
    setModalNuevaCuotaVisible(false);
    Alert.alert('Éxito', 'La cuota ha sido generada correctamente.');
  };

  const handleConfirmarPago = async () => {
    if (!cuotaSeleccionadaPago) return;

    const fechaHoy = new Date().toISOString().split('T')[0];

    if (hasSupabaseCuotas && cuotaSeleccionadaPago.id) {
      await supabase
        .from('cuotas')
        .update({
          estado: 'Pagada',
          fecha_pago: fechaHoy,
          metodo_pago: metodoPago
        })
        .eq('id', cuotaSeleccionadaPago.id);
    }

    setCuotas(prev => prev.map(c => {
      if (c === cuotaSeleccionadaPago || (c.id && c.id === cuotaSeleccionadaPago.id)) {
        return {
          ...c,
          estado: 'Pagada',
          fecha_pago: fechaHoy,
          metodo_pago: metodoPago
        };
      }
      return c;
    }));

    setModalPagoVisible(false);
    Alert.alert('Pago Registrado', `Se registró el pago de la cuota de ${cuotaSeleccionadaPago.alumno_nombre} mediante ${metodoPago}.`);
  };

  // 6. Generar Recibo de Pago en PDF
  const handleGenerarReciboPDF = async (cuota: Cuota) => {
    const html = generarHtmlRecibo(cuota);

    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Éxito', 'Comprobante generado correctamente.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo generar el comprobante PDF.');
    }
  };

  // 7. Filtros calculados
  const filteredInscripciones = useMemo(() => {
    return inscripciones.filter(item => {
      const matchSearch = item.nombre.toLowerCase().includes(searchInscripcion.toLowerCase()) ||
                          item.dni.includes(searchInscripcion) ||
                          item.email.toLowerCase().includes(searchInscripcion.toLowerCase());
      const matchNivel = nivelFilter === 'Todos' || item.nivel === nivelFilter;
      return matchSearch && matchNivel;
    });
  }, [inscripciones, searchInscripcion, nivelFilter]);

  const filteredCuotas = useMemo(() => {
    return cuotas.filter(item => {
      const matchSearch = item.alumno_nombre.toLowerCase().includes(searchCuota.toLowerCase()) ||
                          item.alumno_dni.includes(searchCuota) ||
                          item.mes.toLowerCase().includes(searchCuota.toLowerCase());
      const matchEstado = estadoCuotaFilter === 'Todos' || item.estado === estadoCuotaFilter;
      return matchSearch && matchEstado;
    });
  }, [cuotas, searchCuota, estadoCuotaFilter]);

  // Totales financieros
  const totalRecaudado = useMemo(() => {
    return cuotas
      .filter(c => c.estado === 'Pagada')
      .reduce((sum, c) => sum + c.monto, 0);
  }, [cuotas]);

  const totalPendiente = useMemo(() => {
    return cuotas
      .filter(c => c.estado !== 'Pagada')
      .reduce((sum, c) => sum + c.monto, 0);
  }, [cuotas]);

  if (checkingAuth) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="text-white font-bold mt-4">Verificando credenciales de administrador...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-100 flex-col md:flex-row">
      
      {/* SIDEBAR LATERAL (DESKTOP) */}
      <View className="w-full md:w-64 bg-slate-900 flex-col justify-between p-6 shadow-2xl">
        <View>
          <View className="mb-6 flex-row md:flex-col items-center gap-3">
            <View className="w-12 h-12 bg-orange-600 rounded-2xl items-center justify-center shadow-lg">
              <Text className="text-white text-xl font-black">🛡️</Text>
            </View>
            <View className="flex-1 md:items-center">
              <Text className="text-white font-black uppercase text-sm tracking-wider">Panel Admin</Text>
              <Text className="text-[10px] text-orange-400 font-bold uppercase">Educar para Transformar</Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">{adminEmail}</Text>
            </View>
          </View>

          {/* Menú de navegación */}
          <View className="gap-2">
            <TouchableOpacity 
              onPress={() => setActiveTab('inscripciones')}
              className={`flex-row items-center justify-between p-3 rounded-xl ${activeTab === 'inscripciones' ? 'bg-orange-600' : 'hover:bg-slate-800'}`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-sm">📋</Text>
                <Text className="text-white font-bold text-xs uppercase tracking-wider">Inscripciones</Text>
              </View>
              <View className="bg-slate-900/60 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">{inscripciones.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('cuotas')}
              className={`flex-row items-center justify-between p-3 rounded-xl ${activeTab === 'cuotas' ? 'bg-orange-600' : 'hover:bg-slate-800'}`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-sm">💳</Text>
                <Text className="text-white font-bold text-xs uppercase tracking-wider">Cuotas y Pagos</Text>
              </View>
              <View className="bg-slate-900/60 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">{cuotas.filter(c => c.estado !== 'Pagada').length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('alumnos')}
              className={`flex-row items-center justify-between p-3 rounded-xl ${activeTab === 'alumnos' ? 'bg-orange-600' : 'hover:bg-slate-800'}`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-sm">👥</Text>
                <Text className="text-white font-bold text-xs uppercase tracking-wider">Padrón Alumnos</Text>
              </View>
              <View className="bg-slate-900/60 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">{alumnos.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('sql')}
              className={`flex-row items-center justify-between p-3 rounded-xl ${activeTab === 'sql' ? 'bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'} mt-2 border border-slate-700`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-sm">⚡</Text>
                <Text className="text-white font-bold text-xs uppercase tracking-wider">Supabase SQL</Text>
              </View>
              <Text className="text-emerald-400 text-xs">●</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acciones del pie */}
        <View className="gap-2 mt-6">
          <TouchableOpacity 
            onPress={() => router.push('/')}
            className="bg-slate-800 p-3 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Text className="text-slate-300 text-xs">🌐</Text>
            <Text className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">Ver Web Pública</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSignOut}
            className="bg-red-600/90 hover:bg-red-600 p-3 rounded-xl flex-row items-center justify-center gap-2"
          >
            <Text className="text-white text-xs">🚪</Text>
            <Text className="text-white font-black uppercase text-[10px] tracking-wider">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <View className="flex-1 p-4 md:p-8">
        
        {/* HEADER SUPERIOR */}
        <View className="flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm mb-6 gap-4">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl md:text-2xl font-black text-slate-800">
                {activeTab === 'inscripciones' && 'Gestión de Nuevas Solicitudes de Vacantes'}
                {activeTab === 'cuotas' && 'Gestión Financiera de Cuotas Escolares'}
                {activeTab === 'alumnos' && 'Padrón de Alumnos Inscriptos'}
                {activeTab === 'sql' && 'Configuración de Base de Datos Supabase'}
              </Text>
              <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                <Text className="text-emerald-700 text-[10px] font-black uppercase">En Vivo</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-400 mt-1">
              Conectado a Supabase como Administrador Central ({adminEmail})
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={loadAllData}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl flex-row items-center gap-2 border border-slate-200"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1e3a8a" />
              ) : (
                <>
                  <Text className="text-slate-700 text-xs">🔄</Text>
                  <Text className="text-slate-700 font-bold text-xs uppercase tracking-wider">Actualizar</Text>
                </>
              )}
            </TouchableOpacity>

            {activeTab === 'cuotas' && (
              <TouchableOpacity 
                onPress={() => setModalNuevaCuotaVisible(true)}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2.5 rounded-xl flex-row items-center gap-2 shadow-sm"
              >
                <Text className="text-white text-xs">➕</Text>
                <Text className="text-white font-black text-xs uppercase tracking-wider">Emitir Cuota</Text>
              </TouchableOpacity>
            )}

            {activeTab === 'alumnos' && (
              <TouchableOpacity 
                onPress={() => setModalNuevoAlumnoVisible(true)}
                className="bg-blue-900 hover:bg-blue-800 px-4 py-2.5 rounded-xl flex-row items-center gap-2 shadow-sm"
              >
                <Text className="text-white text-xs">➕</Text>
                <Text className="text-white font-black text-xs uppercase tracking-wider">Nuevo Alumno</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* METRICAS RESUMIDAS */}
        <View className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500">
            <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Solicitudes Nuevas</Text>
            <Text className="text-2xl font-black text-slate-800 mt-1">{inscripciones.length}</Text>
            <Text className="text-[10px] text-orange-600 font-bold mt-1">Desde formulario de inicio</Text>
          </View>

          <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-600">
            <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alumnos Inscriptos</Text>
            <Text className="text-2xl font-black text-slate-800 mt-1">{alumnos.length}</Text>
            <Text className="text-[10px] text-blue-600 font-bold mt-1">Padrón general activo</Text>
          </View>

          <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-emerald-500">
            <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recaudación Cobrada</Text>
            <Text className="text-2xl font-black text-emerald-700 mt-1">${totalRecaudado.toLocaleString('es-AR')}</Text>
            <Text className="text-[10px] text-emerald-600 font-bold mt-1">{cuotas.filter(c => c.estado === 'Pagada').length} cuotas pagadas</Text>
          </View>

          <View className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-amber-500">
            <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cobranzas Pendientes</Text>
            <Text className="text-2xl font-black text-amber-700 mt-1">${totalPendiente.toLocaleString('es-AR')}</Text>
            <Text className="text-[10px] text-amber-600 font-bold mt-1">{cuotas.filter(c => c.estado !== 'Pagada').length} cuotas por cobrar</Text>
          </View>
        </View>

        {/* ---------------- PESTAÑA 1: SOLICITUDES DE INSCRIPCIONES ---------------- */}
        {activeTab === 'inscripciones' && (
          <View className="flex-1 bg-white p-6 rounded-2xl shadow-sm">
            {/* Barra de filtros */}
            <View className="flex-col md:flex-row gap-4 mb-6 justify-between items-center">
              <View className="flex-1 w-full relative">
                <TextInput 
                  placeholder="Buscar por Nombre, DNI o Correo del Tutor..."
                  value={searchInscripcion}
                  onChangeText={setSearchInscripcion}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-xs"
                />
              </View>

              <View className="flex-row gap-2 w-full md:w-auto overflow-x-auto">
                {['Todos', 'Nivel Inicial', 'Nivel Primario', 'Nivel Secundario'].map(nivel => (
                  <TouchableOpacity
                    key={nivel}
                    onPress={() => setNivelFilter(nivel)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${nivelFilter === nivel ? 'bg-orange-600' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <Text className={`text-xs font-bold ${nivelFilter === nivel ? 'text-white' : 'text-slate-600'}`}>
                      {nivel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Listado de solicitudes */}
            {filteredInscripciones.length === 0 ? (
              <View className="p-12 items-center justify-center">
                <Text className="text-4xl mb-2">📭</Text>
                <Text className="text-slate-600 font-bold">No hay solicitudes que coincidan con la búsqueda.</Text>
                <Text className="text-slate-400 text-xs mt-1">Las nuevas solicitudes enviadas desde la web aparecerán acá automáticamente.</Text>
              </View>
            ) : (
              <ScrollView className="flex-1">
                <View className="gap-3">
                  {filteredInscripciones.map((item) => (
                    <View 
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-orange-300 transition-all"
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center gap-3">
                          <Text className="font-black text-slate-800 text-base">{item.nombre}</Text>
                          <View className="bg-blue-100 px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] font-bold text-blue-900">{item.nivel}</Text>
                          </View>
                          <View className="bg-slate-200 px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] font-bold text-slate-700">DNI: {item.dni}</Text>
                          </View>
                        </View>

                        <View className="flex-row flex-wrap gap-4 mt-2 text-xs text-slate-500">
                          <Text className="text-xs text-slate-500">📧 Tutor: <Text className="font-semibold text-slate-700">{item.email}</Text></Text>
                          <Text className="text-xs text-slate-400">📅 Fecha: {new Date(item.created_at).toLocaleString('es-AR')}</Text>
                        </View>

                        {item.mensaje ? (
                          <View className="bg-white border border-slate-200 p-2.5 rounded-lg mt-2">
                            <Text className="text-xs text-slate-600 italic">&quot;{item.mensaje}&quot;</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Botones de acción */}
                      <View className="flex-row gap-2 self-end md:self-center">
                        <TouchableOpacity 
                          onPress={() => {
                            setSelectedInscripcion(item);
                            setModalInscripcionVisible(true);
                          }}
                          className="bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-lg"
                        >
                          <Text className="text-slate-700 font-bold text-xs uppercase">Ver Ficha</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => handleAprobarInscripcion(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg flex-row items-center gap-1 shadow-sm"
                        >
                          <Text className="text-white text-xs">✓</Text>
                          <Text className="text-white font-black text-xs uppercase">Inscribir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={() => handleEliminarInscripcion(item.id, item.nombre)}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-2 rounded-lg"
                        >
                          <Text className="text-red-600 font-bold text-xs">🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* ---------------- PESTAÑA 2: GESTIÓN DE CUOTAS Y PAGOS ---------------- */}
        {activeTab === 'cuotas' && (
          <View className="flex-1 bg-white p-6 rounded-2xl shadow-sm">
            {/* Barra de filtros de cuotas */}
            <View className="flex-col md:flex-row gap-4 mb-6 justify-between items-center">
              <View className="flex-1 w-full relative">
                <TextInput 
                  placeholder="Buscar por Nombre de Alumno, DNI o Mes (ej: Noviembre)..."
                  value={searchCuota}
                  onChangeText={setSearchCuota}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-xs"
                />
              </View>

              <View className="flex-row gap-2 w-full md:w-auto">
                {['Todos', 'Pendiente', 'Pagada', 'Vencida'].map(estado => (
                  <TouchableOpacity
                    key={estado}
                    onPress={() => setEstadoCuotaFilter(estado)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${estadoCuotaFilter === estado ? 'bg-orange-600' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <Text className={`text-xs font-bold ${estadoCuotaFilter === estado ? 'text-white' : 'text-slate-600'}`}>
                      {estado}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filteredCuotas.length === 0 ? (
              <View className="p-12 items-center justify-center">
                <Text className="text-4xl mb-2">💳</Text>
                <Text className="text-slate-600 font-bold">No se encontraron cuotas para este filtro.</Text>
                <TouchableOpacity 
                  onPress={() => setModalNuevaCuotaVisible(true)}
                  className="mt-4 bg-orange-600 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-bold text-xs uppercase">Emitir Primera Cuota</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView className="flex-1">
                <View className="gap-3">
                  {filteredCuotas.map((cuota, idx) => (
                    <View 
                      key={cuota.id || idx}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-all"
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center gap-3">
                          <Text className="font-black text-slate-800 text-base">{cuota.alumno_nombre}</Text>
                          <View className="bg-slate-200 px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] font-bold text-slate-700">DNI: {cuota.alumno_dni}</Text>
                          </View>
                          
                          {/* Badge de estado */}
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
                          <Text className="text-xs text-slate-700 font-semibold">Período: {cuota.mes}</Text>
                          <Text className="text-xs font-bold text-blue-900">Monto: ${cuota.monto.toLocaleString('es-AR')}</Text>
                          {cuota.fecha_vencimiento && cuota.estado !== 'Pagada' && (
                            <Text className="text-xs text-amber-600">Vencimiento: {cuota.fecha_vencimiento}</Text>
                          )}
                          {cuota.fecha_pago && (
                            <Text className="text-xs text-emerald-600">Pagado el: {cuota.fecha_pago} ({cuota.metodo_pago || 'Transferencia'})</Text>
                          )}
                        </View>
                      </View>

                      {/* Acciones de cuota */}
                      <View className="flex-row gap-2 self-end md:self-center">
                        {cuota.estado !== 'Pagada' ? (
                          <TouchableOpacity 
                            onPress={() => {
                              setCuotaSeleccionadaPago(cuota);
                              setModalPagoVisible(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex-row items-center gap-1 shadow-sm"
                          >
                            <Text className="text-white text-xs">💰</Text>
                            <Text className="text-white font-black text-xs uppercase">Registrar Cobro</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            onPress={() => handleGenerarReciboPDF(cuota)}
                            className="bg-blue-900 hover:bg-blue-800 px-3 py-2 rounded-lg flex-row items-center gap-1 shadow-sm"
                          >
                            <Text className="text-white text-xs">📄</Text>
                            <Text className="text-white font-bold text-xs uppercase">Recibo PDF</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* ---------------- PESTAÑA 3: PADRÓN DE ALUMNOS ---------------- */}
        {activeTab === 'alumnos' && (
          <View className="flex-1 bg-white p-6 rounded-2xl shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-base font-black text-slate-800 uppercase tracking-wider">Estudiantes Registrados ({alumnos.length})</Text>
              <TouchableOpacity 
                onPress={() => setModalNuevoAlumnoVisible(true)}
                className="bg-blue-900 px-4 py-2 rounded-xl flex-row items-center gap-2"
              >
                <Text className="text-white text-xs">➕</Text>
                <Text className="text-white font-black text-xs uppercase">Agregar Alumno</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              <View className="gap-3">
                {alumnos.map((alumno, idx) => (
                  <View 
                    key={alumno.dni || idx}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-3">
                        <Text className="font-black text-slate-800 text-base">{alumno.nombre}</Text>
                        <View className="bg-blue-100 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-blue-900">{alumno.nivel}</Text>
                        </View>
                        <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-black text-emerald-800 uppercase">{alumno.estado}</Text>
                        </View>
                      </View>
                      <View className="flex-row gap-4 mt-2 text-xs text-slate-500">
                        <Text className="text-xs text-slate-600">DNI: <Text className="font-bold">{alumno.dni}</Text></Text>
                        <Text className="text-xs text-slate-600">Email: <Text className="font-bold">{alumno.email}</Text></Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2 self-end md:self-center">
                      <TouchableOpacity 
                        onPress={() => {
                          setCuotaDni(alumno.dni);
                          setCuotaNombre(alumno.nombre);
                          setModalNuevaCuotaVisible(true);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg flex-row items-center gap-1"
                      >
                        <Text className="text-white text-xs">💳</Text>
                        <Text className="text-white font-bold text-xs uppercase">Cobrar Cuota</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ---------------- PESTAÑA 4: CONFIGURACIÓN SUPABASE & SQL ---------------- */}
        {activeTab === 'sql' && (
          <ScrollView className="flex-1 bg-white p-6 rounded-2xl shadow-sm">
            <View className="mb-6">
              <Text className="text-lg font-black text-slate-800 uppercase">Instrucciones de Base de Datos Supabase</Text>
              <Text className="text-xs text-slate-500 mt-1">
                Para que la persistencia de cuotas y alumnos quede sincronizada permanentemente en la nube, ejecutá este script en el SQL Editor de Supabase:
              </Text>
            </View>

            <View className="bg-slate-900 p-5 rounded-2xl border border-slate-700 relative mb-6">
              <Text className="text-emerald-400 font-mono text-xs select-all leading-relaxed">
{`-- =======================================================
-- SCRIPT DE INICIALIZACIÓN: TABLAS ALUMNOS Y CUOTAS
-- Proyecto: Educar Para Transformar
-- =======================================================

-- 1. Tabla de Alumnos
CREATE TABLE IF NOT EXISTS public.alumnos (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nombre TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  nivel TEXT NOT NULL,
  email TEXT,
  estado TEXT DEFAULT 'Regular'
);

-- 2. Tabla de Cuotas Escolares
CREATE TABLE IF NOT EXISTS public.cuotas (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  alumno_dni TEXT NOT NULL,
  alumno_nombre TEXT NOT NULL,
  mes TEXT NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 45000,
  estado TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pagada', 'Pendiente', 'Vencida'
  fecha_vencimiento DATE,
  fecha_pago DATE,
  metodo_pago TEXT
);

-- 3. Habilitar Seguridad por Fila (RLS) y Políticas
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total para administradores y aplicacion en alumnos"
ON public.alumnos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acceso total para administradores y aplicacion en cuotas"
ON public.cuotas FOR ALL USING (true) WITH CHECK (true);
`}
              </Text>
            </View>

            <View className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <Text className="text-blue-900 font-bold text-xs uppercase mb-1">📌 Pasos para aplicar en Supabase:</Text>
              <Text className="text-blue-800 text-xs">
                1. Ingresá a tu panel de Supabase: <Text className="font-mono">https://supabase.com/dashboard</Text>{'\n'}
                2. Abrí el proyecto y ve a la sección <Text className="font-bold">&quot;SQL Editor&quot;</Text> en el menú izquierdo.{'\n'}
                3. Haz clic en <Text className="font-bold">&quot;New Query&quot;</Text>, pega el script de arriba y presiona <Text className="font-bold">&quot;Run&quot;</Text>.{'\n'}
                4. ¡Listo! Vuelve al panel de administración y presiona el botón <Text className="font-bold">&quot;Actualizar&quot;</Text>.
              </Text>
            </View>
          </ScrollView>
        )}

      </View>

      {/* ---------------- MODAL FICHA DE INSCRIPCIÓN ---------------- */}
      <Modal visible={modalInscripcionVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <Text className="text-lg font-black text-slate-800 uppercase">Ficha de Solicitud de Vacante</Text>
              <TouchableOpacity onPress={() => setModalInscripcionVisible(false)}>
                <Text className="text-slate-400 font-bold text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            {selectedInscripcion && (
              <View className="gap-3">
                <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Text className="text-[10px] text-slate-400 font-black uppercase">Aspirante</Text>
                  <Text className="text-lg font-black text-slate-900">{selectedInscripcion.nombre}</Text>
                  <Text className="text-xs font-semibold text-slate-600">DNI: {selectedInscripcion.dni}</Text>
                  <Text className="text-xs font-semibold text-blue-900 mt-1">Nivel Solicitado: {selectedInscripcion.nivel}</Text>
                </View>

                <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Text className="text-[10px] text-slate-400 font-black uppercase">Contacto del Tutor</Text>
                  <Text className="text-xs font-bold text-slate-800 mt-1">📧 {selectedInscripcion.email}</Text>
                </View>

                {selectedInscripcion.mensaje ? (
                  <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <Text className="text-[10px] text-slate-400 font-black uppercase">Mensaje Adicional</Text>
                    <Text className="text-xs text-slate-700 mt-1">{selectedInscripcion.mensaje}</Text>
                  </View>
                ) : null}

                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity 
                    onPress={() => handleAprobarInscripcion(selectedInscripcion)}
                    className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
                  >
                    <Text className="text-white font-black uppercase text-xs">Aceptar e Inscribir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleEliminarInscripcion(selectedInscripcion.id, selectedInscripcion.nombre)}
                    className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl items-center"
                  >
                    <Text className="text-red-600 font-bold uppercase text-xs">Descartar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ---------------- MODAL EMITIR NUEVA CUOTA ---------------- */}
      <Modal visible={modalNuevaCuotaVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <Text className="text-lg font-black text-slate-800 uppercase">Emitir Nueva Cuota</Text>
              <TouchableOpacity onPress={() => setModalNuevaCuotaVisible(false)}>
                <Text className="text-slate-400 font-bold text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <TextInput 
                placeholder="DNI del Alumno"
                value={cuotaDni}
                onChangeText={setCuotaDni}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />
              <TextInput 
                placeholder="Nombre Completo del Alumno"
                value={cuotaNombre}
                onChangeText={setCuotaNombre}
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />
              <TextInput 
                placeholder="Período / Mes (Ej: Noviembre 2026)"
                value={cuotaMes}
                onChangeText={setCuotaMes}
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />
              <TextInput 
                placeholder="Monto ($)"
                value={cuotaMonto}
                onChangeText={setCuotaMonto}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />

              <TouchableOpacity 
                onPress={handleCrearCuota}
                className="bg-orange-600 py-4 rounded-xl items-center mt-2 shadow-lg"
              >
                <Text className="text-white font-black uppercase text-xs tracking-wider">Guardar y Emitir Cuota</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------------- MODAL REGISTRAR PAGO DE CUOTA ---------------- */}
      <Modal visible={modalPagoVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <Text className="text-lg font-black text-slate-800 uppercase">Registrar Cobro de Cuota</Text>
              <TouchableOpacity onPress={() => setModalPagoVisible(false)}>
                <Text className="text-slate-400 font-bold text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            {cuotaSeleccionadaPago && (
              <View className="gap-4">
                <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Text className="text-slate-800 font-bold">{cuotaSeleccionadaPago.alumno_nombre}</Text>
                  <Text className="text-xs text-slate-500">Período: {cuotaSeleccionadaPago.mes}</Text>
                  <Text className="text-base font-black text-blue-900 mt-2">Monto a abonar: ${cuotaSeleccionadaPago.monto.toLocaleString('es-AR')}</Text>
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-700 mb-2">Seleccionar Medio de Pago:</Text>
                  <View className="gap-2">
                    {['Transferencia Bancaria', 'Efectivo en Tesorería', 'Tarjeta de Débito/Crédito'].map((metodo) => (
                      <TouchableOpacity 
                        key={metodo}
                        onPress={() => setMetodoPago(metodo)}
                        className={`p-3 rounded-xl border ${metodoPago === metodo ? 'bg-orange-50 border-orange-500' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <Text className={`text-xs font-bold ${metodoPago === metodo ? 'text-orange-900' : 'text-slate-700'}`}>
                          {metodo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={handleConfirmarPago}
                  className="bg-emerald-600 py-4 rounded-xl items-center mt-2 shadow-lg"
                >
                  <Text className="text-white font-black uppercase text-xs tracking-wider">Confirmar Cobro</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ---------------- MODAL NUEVO ALUMNO ---------------- */}
      <Modal visible={modalNuevoAlumnoVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <Text className="text-lg font-black text-slate-800 uppercase">Alta de Nuevo Alumno</Text>
              <TouchableOpacity onPress={() => setModalNuevoAlumnoVisible(false)}>
                <Text className="text-slate-400 font-bold text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <TextInput 
                placeholder="Nombre Completo del Alumno"
                value={nuevoNombre}
                onChangeText={setNuevoNombre}
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />
              <TextInput 
                placeholder="DNI del Alumno"
                value={nuevoDni}
                onChangeText={setNuevoDni}
                keyboardType="numeric"
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />
              <TextInput 
                placeholder="Correo Electrónico del Tutor"
                value={nuevoEmail}
                onChangeText={setNuevoEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />

              <View className="flex-row gap-2">
                {['Nivel Inicial', 'Nivel Primario', 'Nivel Secundario'].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setNuevoNivel(n)}
                    className={`flex-1 p-2.5 rounded-xl border text-center ${nuevoNivel === n ? 'bg-blue-900 border-blue-900' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`text-[10px] font-bold text-center ${nuevoNivel === n ? 'text-white' : 'text-slate-600'}`}>
                      {n.replace('Nivel ', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                onPress={async () => {
                  if (!nuevoNombre.trim() || !nuevoDni.trim()) {
                    Alert.alert('Error', 'Completá nombre y DNI obligatoriamente.');
                    return;
                  }
                  const alumno: Alumno = {
                    nombre: nuevoNombre.trim(),
                    dni: nuevoDni.trim(),
                    nivel: nuevoNivel,
                    email: nuevoEmail.trim(),
                    estado: 'Regular'
                  };
                  if (hasSupabaseAlumnos) {
                    await supabase.from('alumnos').insert([alumno]);
                  }
                  setAlumnos(prev => [alumno, ...prev]);
                  setNuevoNombre('');
                  setNuevoDni('');
                  setNuevoEmail('');
                  setModalNuevoAlumnoVisible(false);
                  Alert.alert('Éxito', 'Alumno ingresado al padrón correctamente.');
                }}
                className="bg-blue-900 py-4 rounded-xl items-center mt-2 shadow-lg"
              >
                <Text className="text-white font-black uppercase text-xs tracking-wider">Guardar Alumno</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
