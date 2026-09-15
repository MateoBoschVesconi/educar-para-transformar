import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState('Cargando...');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email || '');
      } else {
        router.replace('/');
      }
    });
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100 flex-row">
      {/* SIDEBAR */}
      <View className="w-64 bg-blue-900 flex-col justify-between p-6 shadow-xl hidden md:flex">
        <View>
          <View className="mb-8 items-center">
            <Text className="text-lg font-black tracking-wider uppercase text-white">Educar Para Transformar</Text>
            <Text className="text-[10px] text-blue-300 uppercase">Panel del Estudiante</Text>
          </View>

          <View className="gap-2">
            <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-blue-800 rounded-xl">
              <Text className="text-white text-sm">🏠</Text>
              <Text className="font-bold text-xs uppercase tracking-wider text-white">Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-3 p-3 rounded-xl hover:bg-blue-800">
              <Text className="text-blue-200 text-sm">🎓</Text>
              <Text className="font-bold text-xs uppercase tracking-wider text-blue-200">Mis Cursos</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-3 p-3 rounded-xl hover:bg-blue-800">
              <Text className="text-blue-200 text-sm">📜</Text>
              <Text className="font-bold text-xs uppercase tracking-wider text-blue-200">Certificados</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-red-600 p-3 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Text className="text-white">🚪</Text>
          <Text className="font-black uppercase text-xs tracking-widest text-white">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View className="flex-1 p-6 md:p-10">
        {/* MOBILE BACK BUTTON */}
        <View className="md:hidden mb-6">
          <Link href="/" asChild>
            <TouchableOpacity className="flex-row items-center gap-2 bg-white p-3 rounded-xl shadow-sm self-start">
              <Text className="text-slate-600">⬅️</Text>
              <Text className="font-bold text-xs uppercase tracking-wider text-slate-600">Volver al inicio</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View className="flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
          <View className="flex-1 pr-4">
            <Text className="text-xl md:text-2xl font-black text-slate-800">¡Bienvenido de nuevo!</Text>
            <Text className="text-xs font-bold text-slate-400 mt-1">{email}</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
            <Text className="text-blue-900 font-black">{email.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="flex-row flex-wrap gap-6 mb-6">
            <View className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600 flex-1 min-w-[200px]">
              <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado Académico</Text>
              <Text className="text-2xl font-black text-slate-800 mt-2">Regular</Text>
            </View>
            <View className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500 flex-1 min-w-[200px]">
              <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Asistencia General</Text>
              <Text className="text-2xl font-black text-slate-800 mt-2">94%</Text>
            </View>
            <View className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500 flex-1 min-w-[200px]">
              <Text className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Avisos Pendientes</Text>
              <Text className="text-2xl font-black text-slate-800 mt-2">2 Nuevos</Text>
            </View>
          </View>

          <View className="bg-white p-6 rounded-2xl shadow-sm">
            <Text className="font-black text-slate-800 uppercase text-xs tracking-wider mb-4">Circular Informativa</Text>
            <View className="p-4 bg-slate-50 rounded-xl">
              <Text className="text-slate-600 text-xs leading-relaxed">
                Estimado alumno/tutor, le recordamos que las mesas de examen del periodo Julio ya se encuentran abiertas para la inscripción desde la sección "Mis Cursos". Ante cualquier duda técnica, contactar a soporte.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
