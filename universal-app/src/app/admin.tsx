import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { generarHtmlReciboPago, descargarOImprimirPDF } from '../utils/pdf-documents';
import { FormModal } from '../components/form-modal';

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

function generarCuotasDesdeHoy(dni: string, nombre: string, montoBase: number = 45000): Cuota[] {
  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const cuotasGeneradas: Cuota[] = [];

  // Cuota inicial de Matrícula
  cuotasGeneradas.push({
    alumno_dni: dni,
    alumno_nombre: nombre,
    mes: `Matrícula ${anioActual}`,
    monto: montoBase + 5000,
    estado: 'Pendiente',
    fecha_vencimiento: `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-20`
  });

  // Cuotas mensuales desde el mes actual en adelante (próximos 5 meses)
  for (let i = 0; i < 5; i++) {
    const d = new Date(anioActual, mesActual + i, 15);
    const mNombre = mesesNombres[d.getMonth()];
    const anio = d.getFullYear();
    const vencimiento = `${anio}-${String(d.getMonth() + 1).padStart(2, '0')}-15`;

    cuotasGeneradas.push({
      alumno_dni: dni,
      alumno_nombre: nombre,
      mes: `${mNombre} ${anio}`,
      monto: montoBase,
      estado: 'Pendiente',
      fecha_vencimiento: vencimiento
    });
  }

  return cuotasGeneradas;
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

  // Modales existentes
  const [selectedInscripcion, setSelectedInscripcion] = useState<Inscripcion | null>(null);
  const [modalInscripcionVisible, setModalInscripcionVisible] = useState(false);
  
  // Modal Crear Perfil de Alumno (al hacer clic en Inscribir)
  const [modalCrearPerfilVisible, setModalCrearPerfilVisible] = useState(false);
  const [inscripcionSeleccionadaParaPerfil, setInscripcionSeleccionadaParaPerfil] = useState<Inscripcion | null>(null);
  const [perfilNombre, setPerfilNombre] = useState('');
  const [perfilDni, setPerfilDni] = useState('');
  const [perfilNivel, setPerfilNivel] = useState('Nivel Inicial');
  const [perfilEmail, setPerfilEmail] = useState('');
  const [perfilPassword, setPerfilPassword] = useState('Alumno123456!');
  const [perfilEstado, setPerfilEstado] = useState('Regular');
  const [perfilMontoCuota, setPerfilMontoCuota] = useState('45000');

  // Modal Ver Perfil de Alumno con sus Cuotas desde hoy en adelante
  const [modalPerfilAlumnoVisible, setModalPerfilAlumnoVisible] = useState(false);
  const [alumnoSeleccionadoPerfil, setAlumnoSeleccionadoPerfil] = useState<Alumno | null>(null);

  // Modal Nueva Cuota manual
  const [modalNuevaCuotaVisible, setModalNuevaCuotaVisible] = useState(false);
  const [cuotaDni, setCuotaDni] = useState('');
  const [cuotaNombre, setCuotaNombre] = useState('');
  const [cuotaMes, setCuotaMes] = useState('Noviembre 2026');
  const [cuotaMonto, setCuotaMonto] = useState('45000');

  // Modal Nuevo Alumno manual
  const [modalNuevoAlumnoVisible, setModalNuevoAlumnoVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoNivel, setNuevoNivel] = useState('Nivel Inicial');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('Alumno123456!');

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

  // 4. Iniciar Creación de Perfil de Alumno desde Inscripción
  const handleAbrirCrearPerfil = (inscripcion: Inscripcion) => {
    setInscripcionSeleccionadaParaPerfil(inscripcion);
    setPerfilNombre(inscripcion.nombre);
    setPerfilDni(inscripcion.dni);
    setPerfilNivel(inscripcion.nivel || 'Nivel Inicial');
    setPerfilEmail(inscripcion.email);
    const dniNumeros = inscripcion.dni.replace(/\D/g, '') || '123456';
    setPerfilPassword(`Alumno.${dniNumeros}!`);
    setPerfilEstado('Regular');
    setPerfilMontoCuota('45000');
    setModalInscripcionVisible(false);
    setModalCrearPerfilVisible(true);
  };

  // Confirmar creación de perfil, cuenta en Supabase Auth y generar cuotas desde hoy
  const handleConfirmarCrearPerfil = async () => {
    if (!perfilNombre.trim() || !perfilDni.trim() || !perfilEmail.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresá Nombre, DNI y Correo del alumno.');
      return;
    }

    const passFinal = perfilPassword.trim() || `Alumno.${perfilDni.replace(/\D/g, '') || '123456'}!`;

    // 1. Crear usuario en Supabase Auth con cliente temporal (sin alterar sesión de administrador)
    try {
      const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      await tempAuthClient.auth.signUp({
        email: perfilEmail.trim(),
        password: passFinal,
        options: {
          data: {
            nombre: perfilNombre.trim(),
            dni: perfilDni.trim(),
            nivel: perfilNivel,
            rol: 'alumno'
          }
        }
      });
    } catch (authErr) {
      console.warn('Aviso al registrar en Supabase Auth:', authErr);
    }

    const nuevoAlumno: Alumno = {
      nombre: perfilNombre.trim(),
      dni: perfilDni.trim(),
      nivel: perfilNivel,
      email: perfilEmail.trim(),
      estado: perfilEstado,
    };

    const montoBase = parseFloat(perfilMontoCuota) || 45000;
    const nuevasCuotas = generarCuotasDesdeHoy(perfilDni.trim(), perfilNombre.trim(), montoBase);

    // Persistir alumno y cuotas en Supabase si existen las tablas
    if (hasSupabaseAlumnos) {
      await supabase.from('alumnos').insert([nuevoAlumno]);
    }
    if (hasSupabaseCuotas) {
      await supabase.from('cuotas').insert(nuevasCuotas);
    }

    // Actualizar estado en memoria
    setAlumnos(prev => [nuevoAlumno, ...prev.filter(a => a.dni !== nuevoAlumno.dni)]);
    setCuotas(prev => [...nuevasCuotas, ...prev]);

    // Eliminar la solicitud de inscripciones para que no quede duplicada
    if (inscripcionSeleccionadaParaPerfil) {
      await supabase.from('inscripciones').delete().eq('id', inscripcionSeleccionadaParaPerfil.id);
      setInscripciones(prev => prev.filter(i => i.id !== inscripcionSeleccionadaParaPerfil.id));
    }

    setModalCrearPerfilVisible(false);

    // Abrir inmediatamente el Perfil del Alumno creado para ver sus cuotas
    setAlumnoSeleccionadoPerfil(nuevoAlumno);
    setModalPerfilAlumnoVisible(true);

    Alert.alert(
      '¡Perfil y Acceso Creados!',
      `Se dio de alta el perfil de ${nuevoAlumno.nombre} en el padrón y se habilitó su cuenta de acceso:\n\n` +
      `📧 Correo: ${nuevoAlumno.email}\n` +
      `🔑 Contraseña: ${passFinal}\n\n` +
      `El alumno ya puede acceder a su panel con estas credenciales.`
    );
  };

  // Botón directo "Pague la cuota"
  const handlePagarCuotaDirecto = async (cuota: Cuota) => {
    const fechaHoy = new Date().toISOString().split('T')[0];

    if (hasSupabaseCuotas && cuota.id) {
      await supabase
        .from('cuotas')
        .update({
          estado: 'Pagada',
          fecha_pago: fechaHoy,
          metodo_pago: 'Efectivo / Tesorería'
        })
        .eq('id', cuota.id);
    }

    // Actualizar cuotas locales
    setCuotas(prev => prev.map(c => {
      if ((c.id && cuota.id && c.id === cuota.id) || (c.alumno_dni === cuota.alumno_dni && c.mes === cuota.mes)) {
        return {
          ...c,
          estado: 'Pagada',
          fecha_pago: fechaHoy,
          metodo_pago: 'Efectivo / Tesorería'
        };
      }
      return c;
    }));

    Alert.alert(
      '¡Cuota Pagada!',
      `La cuota de ${cuota.mes} para ${cuota.alumno_nombre} ha sido registrada como PAGADA por este mes.`
    );
  };

  // Abrir perfil de alumno existente desde el padrón
  const handleVerPerfilAlumno = (alumno: Alumno) => {
    setAlumnoSeleccionadoPerfil(alumno);
    setModalPerfilAlumnoVisible(true);
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

  // Acciones sobre Cuotas
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

  // Generar Recibo de Pago en PDF oficial
  const handleGenerarReciboPDF = async (cuota: Cuota) => {
    try {
      const html = generarHtmlReciboPago({
        id: cuota.id,
        alumnoNombre: cuota.alumno_nombre,
        alumnoDni: cuota.alumno_dni,
        mes: cuota.mes,
        monto: cuota.monto,
        fechaPago: cuota.fecha_pago,
        metodoPago: cuota.metodo_pago || 'Transferencia Bancaria'
      });

      await descargarOImprimirPDF(html, `Recibo_Cuota_${cuota.mes.replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo generar el comprobante PDF.');
    }
  };

  // Filtros calculados
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

  // Cuotas específicas del alumno que se encuentra abierto en el modal de perfil
  const cuotasDelAlumnoPerfil = useMemo(() => {
    if (!alumnoSeleccionadoPerfil) return [];
    return cuotas.filter(c => c.alumno_dni === alumnoSeleccionadoPerfil.dni);
  }, [cuotas, alumnoSeleccionadoPerfil]);

  // Cuota actual/inmediata del alumno (ej: mes actual o primera pendiente)
  const cuotaMesActualAlumno = useMemo(() => {
    if (cuotasDelAlumnoPerfil.length === 0) return null;
    const pendiente = cuotasDelAlumnoPerfil.find(c => c.estado !== 'Pagada');
    return pendiente || cuotasDelAlumnoPerfil[0];
  }, [cuotasDelAlumnoPerfil]);

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

  const { width } = useWindowDimensions();
  const isWide = width >= 840;

  if (checkingAuth) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="text-white font-bold mt-4">Verificando credenciales de administrador...</Text>
      </SafeAreaView>
    );
  }

  const tabClass = (active: boolean) =>
    `flex-row items-center gap-2 px-3 py-3 rounded-xl ${isWide ? 'justify-between' : 'mr-2'} ${active ? 'bg-orange-600' : 'bg-slate-800'}`;

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top', 'left', 'right']}>
      <View className={`flex-1 ${isWide ? 'flex-row' : 'flex-col'}`}>

      {isWide ? (
      <View className="w-64 bg-slate-900 justify-between p-6">
        <View>
          <View className="mb-6 items-center gap-3">
            <View className="w-12 h-12 bg-orange-600 rounded-2xl items-center justify-center">
              <Text className="text-white text-xl font-black">🛡️</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-black uppercase text-sm tracking-wider">Panel Admin</Text>
              <Text className="text-[10px] text-orange-400 font-bold uppercase">Educar para Transformar</Text>
              <Text className="text-[10px] text-slate-400 mt-0.5 text-center" numberOfLines={1}>{adminEmail}</Text>
            </View>
          </View>
          <View className="gap-2">
            <TouchableOpacity onPress={() => setActiveTab('inscripciones')} className={tabClass(activeTab === 'inscripciones')}>
              <Text className="text-white text-sm">📋</Text>
              <Text className="text-white font-bold text-xs uppercase flex-1">Inscripciones</Text>
              <Text className="text-white text-[10px] font-bold">{inscripciones.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('cuotas')} className={tabClass(activeTab === 'cuotas')}>
              <Text className="text-white text-sm">💳</Text>
              <Text className="text-white font-bold text-xs uppercase flex-1">Cuotas</Text>
              <Text className="text-white text-[10px] font-bold">{cuotas.filter(c => c.estado !== 'Pagada').length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('alumnos')} className={tabClass(activeTab === 'alumnos')}>
              <Text className="text-white text-sm">👥</Text>
              <Text className="text-white font-bold text-xs uppercase flex-1">Padrón</Text>
              <Text className="text-white text-[10px] font-bold">{alumnos.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('sql')} className={tabClass(activeTab === 'sql')}>
              <Text className="text-white text-sm">⚡</Text>
              <Text className="text-white font-bold text-xs uppercase flex-1">Supabase SQL</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="gap-2 mt-6">
          <TouchableOpacity onPress={() => router.push('/')} className="bg-slate-800 p-3 rounded-xl items-center">
            <Text className="text-slate-300 font-bold uppercase text-[10px]">Ver web pública</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} className="bg-red-600 p-3 rounded-xl items-center">
            <Text className="text-white font-black uppercase text-[10px]">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : (
      <View className="bg-slate-900 px-4 pt-3 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-3">
            <Text className="text-white font-black uppercase text-sm">Panel Admin</Text>
            <Text className="text-[10px] text-orange-300" numberOfLines={1}>{adminEmail}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} className="bg-red-600 px-3 py-2 rounded-xl">
            <Text className="text-white text-[10px] font-black uppercase">Salir</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setActiveTab('inscripciones')} className={tabClass(activeTab === 'inscripciones')}>
            <Text className="text-white text-sm">📋</Text>
            <Text className="text-white font-bold text-xs uppercase">Inscripciones</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('cuotas')} className={tabClass(activeTab === 'cuotas')}>
            <Text className="text-white text-sm">💳</Text>
            <Text className="text-white font-bold text-xs uppercase">Cuotas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('alumnos')} className={tabClass(activeTab === 'alumnos')}>
            <Text className="text-white text-sm">👥</Text>
            <Text className="text-white font-bold text-xs uppercase">Padrón</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('sql')} className={tabClass(activeTab === 'sql')}>
            <Text className="text-white text-sm">⚡</Text>
            <Text className="text-white font-bold text-xs uppercase">SQL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/')} className="px-3 py-3 rounded-xl bg-slate-800">
            <Text className="text-slate-200 font-bold text-xs uppercase">Web</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      )}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 48 }}
      >
        
        {/* HEADER SUPERIOR */}
        <View className="bg-white p-4 rounded-2xl mb-4 gap-3">
          <View>
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-lg font-black text-slate-800 flex-1">
                {activeTab === 'inscripciones' && 'Gestión de Nuevas Solicitudes de Vacantes'}
                {activeTab === 'cuotas' && 'Gestión Financiera de Cuotas Escolares'}
                {activeTab === 'alumnos' && 'Padrón y Perfiles de Alumnos Inscriptos'}
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

          <View className="flex-row flex-wrap gap-2">
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
        <View className="gap-3 mb-4">
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

              <View className="flex-row flex-wrap gap-2 w-full">
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

                        {/* Botón Inscribir que abre la opción de Crear Perfil de Alumno */}
                        <TouchableOpacity 
                          onPress={() => handleAbrirCrearPerfil(item)}
                          className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex-row items-center gap-1.5 shadow-sm"
                        >
                          <Text className="text-white text-xs">👤</Text>
                          <Text className="text-white font-black text-xs uppercase">Inscribir Alumno</Text>
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
                            onPress={() => handlePagarCuotaDirecto(cuota)}
                            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex-row items-center gap-1.5 shadow-sm"
                          >
                            <Text className="text-white text-xs">💰</Text>
                            <Text className="text-white font-black text-xs uppercase">Pague la cuota</Text>
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
            <View className="flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <View className="flex-1">
                <Text className="text-base font-black text-slate-800 uppercase tracking-wider">Padrón de Estudiantes ({alumnos.length})</Text>
                <Text className="text-xs text-slate-400">Haz clic en &quot;Ver Perfil y Cuotas&quot; para consultar y cobrar cuotas de cada alumno.</Text>
              </View>
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
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-all"
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
                        <Text className="text-xs text-slate-600">Email Tutor: <Text className="font-bold">{alumno.email}</Text></Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2 self-end md:self-center">
                      {/* Botón Ver Perfil y Cuotas */}
                      <TouchableOpacity 
                        onPress={() => handleVerPerfilAlumno(alumno)}
                        className="bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg flex-row items-center gap-1.5 shadow-sm"
                      >
                        <Text className="text-white text-xs">👤</Text>
                        <Text className="text-white font-black text-xs uppercase">Ver Perfil y Cuotas</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => {
                          setCuotaDni(alumno.dni);
                          setCuotaNombre(alumno.nombre);
                          setModalNuevaCuotaVisible(true);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg flex-row items-center gap-1"
                      >
                        <Text className="text-white text-xs">💳</Text>
                        <Text className="text-white font-bold text-xs uppercase">Nueva Cuota</Text>
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

      </ScrollView>
      </View>

      {/* ---------------- MODAL 1: FICHA DE INSCRIPCIÓN ---------------- */}
      <Modal visible={modalInscripcionVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <Text className="flex-1 pr-3 text-lg font-black text-slate-800 uppercase">Ficha de Solicitud de Vacante</Text>
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
                    onPress={() => handleAbrirCrearPerfil(selectedInscripcion)}
                    className="flex-1 bg-emerald-600 py-3 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    <Text className="text-white text-xs">👤</Text>
                    <Text className="text-white font-black uppercase text-xs">Crear Perfil e Inscribir</Text>
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

      {/* ---------------- MODAL 2: CREAR PERFIL DEL ALUMNO (AL INSCRIBIR) ---------------- */}
      <FormModal visible={modalCrearPerfilVisible}>
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <View>
                <Text className="text-lg font-black text-slate-800 uppercase">Crear Perfil del Alumno</Text>
                <Text className="text-xs text-orange-600 font-bold">Alta en Padrón y Calendario de Cuotas</Text>
              </View>
              <TouchableOpacity onPress={() => setModalCrearPerfilVisible(false)}>
                <Text className="text-slate-400 font-bold text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View>
                <Text className="text-[11px] font-bold text-slate-600 mb-1">Nombre Completo del Alumno:</Text>
                <TextInput 
                  placeholder="Nombre y Apellido"
                  value={perfilNombre}
                  onChangeText={setPerfilNombre}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-600 mb-1">DNI / Documento:</Text>
                  <TextInput 
                    placeholder="DNI"
                    value={perfilDni}
                    onChangeText={setPerfilDni}
                    keyboardType="numeric"
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] font-bold text-slate-600 mb-1">Cuota Base ($):</Text>
                  <TextInput 
                    placeholder="Monto"
                    value={perfilMontoCuota}
                    onChangeText={setPerfilMontoCuota}
                    keyboardType="numeric"
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-bold text-slate-600 mb-1">Correo Electrónico de Acceso (Usuario):</Text>
                <TextInput 
                  placeholder="email@tutor.com"
                  value={perfilEmail}
                  onChangeText={setPerfilEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800"
                />
              </View>

              <View>
                <Text className="text-[11px] font-bold text-slate-600 mb-1">Contraseña de Acceso para el Alumno:</Text>
                <TextInput 
                  placeholder="Contraseña inicial"
                  value={perfilPassword}
                  onChangeText={setPerfilPassword}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800 font-mono"
                />
                <Text className="text-[10px] text-slate-400 mt-0.5">El estudiante usará este correo y clave para ingresar a su panel.</Text>
              </View>

              <View>
                <Text className="text-[11px] font-bold text-slate-600 mb-1">Nivel Educativo:</Text>
                <View className="flex-row gap-2">
                  {['Nivel Inicial', 'Nivel Primario', 'Nivel Secundario'].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setPerfilNivel(n)}
                      className={`flex-1 p-2.5 rounded-xl border text-center ${perfilNivel === n ? 'bg-blue-900 border-blue-900' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <Text className={`text-[10px] font-bold text-center ${perfilNivel === n ? 'text-white' : 'text-slate-600'}`}>
                        {n.replace('Nivel ', '')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-[11px] font-bold text-slate-600 mb-1">Estado Académico Inicial:</Text>
                <View className="flex-row gap-2">
                  {['Regular', 'Becado', 'Condicional'].map(est => (
                    <TouchableOpacity
                      key={est}
                      onPress={() => setPerfilEstado(est)}
                      className={`flex-1 p-2.5 rounded-xl border text-center ${perfilEstado === est ? 'bg-emerald-700 border-emerald-700' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <Text className={`text-[10px] font-bold text-center ${perfilEstado === est ? 'text-white' : 'text-slate-600'}`}>
                        {est}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="bg-amber-50 border border-amber-200 p-3 rounded-xl mt-1">
                <Text className="text-[11px] text-amber-800">
                  ℹ️ Al confirmar, el alumno ingresará al padrón escolar y se generará automáticamente su calendario de cuotas (Matrícula y cuotas desde el día de hoy en adelante).
                </Text>
              </View>

              <TouchableOpacity 
                onPress={handleConfirmarCrearPerfil}
                className="bg-emerald-600 hover:bg-emerald-700 py-4 rounded-xl items-center mt-2 shadow-lg"
              >
                <Text className="text-white font-black uppercase text-xs tracking-wider">Crear Perfil y Generar Cuotas</Text>
              </TouchableOpacity>
            </View>
      </FormModal>

      {/* ---------------- MODAL 3: PERFIL DEL ALUMNO Y SUS CUOTAS DESDE HOY ---------------- */}
      <Modal visible={modalPerfilAlumnoVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 p-4">
          <View className="bg-white p-6 rounded-3xl w-full max-w-2xl shadow-2xl flex-col" style={{ maxHeight: '90%' }}>
            
            {/* Header del Perfil */}
            <View className="flex-row justify-between items-start border-b border-slate-100 pb-4 mb-4">
              {alumnoSeleccionadoPerfil && (
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-blue-900 rounded-2xl items-center justify-center shadow-md">
                    <Text className="text-white font-black text-lg">
                      {alumnoSeleccionadoPerfil.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-xl font-black text-slate-800">{alumnoSeleccionadoPerfil.nombre}</Text>
                      <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] font-black text-emerald-800 uppercase">{alumnoSeleccionadoPerfil.estado}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      DNI: <Text className="font-bold text-slate-700">{alumnoSeleccionadoPerfil.dni}</Text> • {alumnoSeleccionadoPerfil.nivel} • 📧 {alumnoSeleccionadoPerfil.email}
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5 mt-2">
                      <View className="bg-blue-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-blue-900">🇬🇧 Inglés Cambridge B1</Text>
                      </View>
                      <View className="bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-emerald-900">⚽ Fútbol Formativo</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              <TouchableOpacity onPress={() => setModalPerfilAlumnoVisible(false)}>
                <Text className="text-slate-400 font-bold text-2xl">✕</Text>
              </TouchableOpacity>
            </View>

            {/* CUOTA DEL MES ACTUAL / EN CURSO - SECCIÓN DESTACADA CON BOTÓN 'PAGUE LA CUOTA' */}
            {cuotaMesActualAlumno && (
              <View className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 rounded-2xl shadow-md mb-4 bg-orange-600">
                <View className="flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <View>
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-white font-bold text-xs uppercase tracking-wider">Cuota de este mes ({cuotaMesActualAlumno.mes})</Text>
                      <View className={`px-2 py-0.5 rounded-full ${cuotaMesActualAlumno.estado === 'Pagada' ? 'bg-emerald-400' : 'bg-amber-300'}`}>
                        <Text className="text-slate-900 text-[10px] font-black uppercase">{cuotaMesActualAlumno.estado}</Text>
                      </View>
                    </View>
                    <Text className="text-white text-2xl font-black mt-1">
                      ${cuotaMesActualAlumno.monto.toLocaleString('es-AR')}
                    </Text>
                    {cuotaMesActualAlumno.fecha_pago ? (
                      <Text className="text-orange-100 text-xs mt-0.5">
                        Abonada el {cuotaMesActualAlumno.fecha_pago} ({cuotaMesActualAlumno.metodo_pago || 'Tesorería'})
                      </Text>
                    ) : (
                      <Text className="text-orange-100 text-xs mt-0.5">
                        Vence: {cuotaMesActualAlumno.fecha_vencimiento || 'Al día'}
                      </Text>
                    )}
                  </View>

                  {/* BOTÓN SOLICITADO: 'PAGUE LA CUOTA' */}
                  {cuotaMesActualAlumno.estado !== 'Pagada' ? (
                    <TouchableOpacity 
                      onPress={() => handlePagarCuotaDirecto(cuotaMesActualAlumno)}
                      className="bg-white hover:bg-slate-100 px-6 py-3.5 rounded-xl flex-row items-center gap-2 shadow-lg self-stretch md:self-auto justify-center"
                    >
                      <Text className="text-emerald-700 text-base">💰</Text>
                      <Text className="text-emerald-800 font-black uppercase text-xs tracking-wider">
                        Pague la cuota
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => handleGenerarReciboPDF(cuotaMesActualAlumno)}
                      className="bg-white/90 hover:bg-white px-5 py-3 rounded-xl flex-row items-center gap-2 shadow-md"
                    >
                      <Text className="text-blue-900 text-xs">📄</Text>
                      <Text className="text-blue-900 font-black uppercase text-xs tracking-wider">
                        Ver Recibo PDF
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* LISTA DE TODAS LAS CUOTAS DESDE HOY EN ADELANTE */}
            <View className="flex-1">
              <View className="flex-col md:flex-row md:justify-between md:items-center gap-2 mb-3">
                <Text className="md:flex-1 font-black text-slate-800 text-xs uppercase tracking-wider">
                  Cuotas a pagar desde el día de hoy en adelante ({cuotasDelAlumnoPerfil.length})
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (alumnoSeleccionadoPerfil) {
                      setCuotaDni(alumnoSeleccionadoPerfil.dni);
                      setCuotaNombre(alumnoSeleccionadoPerfil.nombre);
                      setModalNuevaCuotaVisible(true);
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  <Text className="text-slate-700 font-bold text-[10px] uppercase">➕ Agregar otra cuota</Text>
                </TouchableOpacity>
              </View>

              {cuotasDelAlumnoPerfil.length === 0 ? (
                <View className="p-8 items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
                  <Text className="text-3xl mb-1">📅</Text>
                  <Text className="text-slate-600 font-bold text-xs">No hay cuotas programadas para este alumno.</Text>
                </View>
              ) : (
                <ScrollView className="flex-1">
                  <View className="gap-2.5">
                    {cuotasDelAlumnoPerfil.map((c, i) => (
                      <View 
                        key={c.id || i}
                        className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex-col md:flex-row justify-between items-start md:items-center gap-3"
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="font-bold text-slate-800 text-sm">{c.mes}</Text>
                            <View className={`px-2 py-0.5 rounded-full ${
                              c.estado === 'Pagada' ? 'bg-emerald-100' :
                              c.estado === 'Pendiente' ? 'bg-amber-100' : 'bg-red-100'
                            }`}>
                              <Text className={`text-[9px] font-black uppercase ${
                                c.estado === 'Pagada' ? 'text-emerald-800' :
                                c.estado === 'Pendiente' ? 'text-amber-800' : 'text-red-800'
                              }`}>
                                {c.estado}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs text-slate-500 mt-1">
                            Monto: <Text className="font-black text-blue-900">${c.monto.toLocaleString('es-AR')}</Text>
                            {c.fecha_vencimiento && c.estado !== 'Pagada' && (
                              <Text className="text-slate-500"> • Vence: {c.fecha_vencimiento}</Text>
                            )}
                            {c.fecha_pago && (
                              <Text className="text-emerald-700"> • Pagado: {c.fecha_pago}</Text>
                            )}
                          </Text>
                        </View>

                        <View className="flex-row gap-2 self-end md:self-center">
                          {c.estado !== 'Pagada' ? (
                            <TouchableOpacity 
                              onPress={() => handlePagarCuotaDirecto(c)}
                              className="bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-lg flex-row items-center gap-1 shadow-sm"
                            >
                              <Text className="text-white text-xs">💰</Text>
                              <Text className="text-white font-black text-xs uppercase">Pague la cuota</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              onPress={() => handleGenerarReciboPDF(c)}
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

          </View>
        </View>
      </Modal>

      {/* ---------------- MODAL 4: EMITIR NUEVA CUOTA MANUAL ---------------- */}
      <FormModal visible={modalNuevaCuotaVisible}>
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
      </FormModal>

      {/* ---------------- MODAL ALTA DE NUEVO ALUMNO MANUAL ---------------- */}
      <FormModal visible={modalNuevoAlumnoVisible}>
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
                placeholder="Correo Electrónico de Acceso"
                value={nuevoEmail}
                onChangeText={setNuevoEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs"
              />
              <TextInput 
                placeholder="Contraseña de Acceso para el Alumno"
                value={nuevoPassword}
                onChangeText={setNuevoPassword}
                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-mono"
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
                  if (!nuevoNombre.trim() || !nuevoDni.trim() || !nuevoEmail.trim()) {
                    Alert.alert('Error', 'Completá nombre, DNI y correo obligatoriamente.');
                    return;
                  }

                  const passFinal = nuevoPassword.trim() || `Alumno.${nuevoDni.replace(/\D/g, '') || '123'}!`;

                  // Registrar cuenta en Supabase Auth
                  try {
                    const tempAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
                      auth: { persistSession: false, autoRefreshToken: false }
                    });
                    await tempAuthClient.auth.signUp({
                      email: nuevoEmail.trim(),
                      password: passFinal,
                      options: {
                        data: {
                          nombre: nuevoNombre.trim(),
                          dni: nuevoDni.trim(),
                          nivel: nuevoNivel,
                          rol: 'alumno'
                        }
                      }
                    });
                  } catch (authErr) {
                    console.warn('Aviso Auth:', authErr);
                  }

                  const alumno: Alumno = {
                    nombre: nuevoNombre.trim(),
                    dni: nuevoDni.trim(),
                    nivel: nuevoNivel,
                    email: nuevoEmail.trim(),
                    estado: 'Regular'
                  };

                  const nuevasCuotas = generarCuotasDesdeHoy(nuevoDni.trim(), nuevoNombre.trim(), 45000);

                  if (hasSupabaseAlumnos) {
                    await supabase.from('alumnos').insert([alumno]);
                  }
                  if (hasSupabaseCuotas) {
                    await supabase.from('cuotas').insert(nuevasCuotas);
                  }

                  setAlumnos(prev => [alumno, ...prev]);
                  setCuotas(prev => [...nuevasCuotas, ...prev]);
                  setNuevoNombre('');
                  setNuevoDni('');
                  setNuevoEmail('');
                  setModalNuevoAlumnoVisible(false);

                  Alert.alert(
                    '¡Alumno y Acceso Creados!',
                    `El alumno fue ingresado y puede acceder con:\n\n` +
                    `📧 Correo: ${alumno.email}\n` +
                    `🔑 Contraseña: ${passFinal}`
                  );
                }}
                className="bg-blue-900 py-4 rounded-xl items-center mt-2 shadow-lg"
              >
                <Text className="text-white font-black uppercase text-xs tracking-wider">Guardar Alumno y Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
      </FormModal>

    </SafeAreaView>
  );
}
