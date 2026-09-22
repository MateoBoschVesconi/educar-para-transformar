import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState('Cargando...');
  const [documento, setDocumento] = useState('');

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

  const handleGenerateCertificate = async () => {
    if (!documento.trim()) {
      Alert.alert('Error', 'Por favor ingresá tu documento o legajo.');
      return;
    }

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center; color: #333;">
          <div style="border: 4px solid #1e3a8a; padding: 40px; border-radius: 10px; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #1e3a8a; font-size: 32px; text-transform: uppercase;">Certificado de Alumno Regular</h1>
            <p style="font-size: 20px; margin-top: 40px; line-height: 1.5;">
              Se deja constancia que la persona con documento / legajo N° <strong style="font-size: 24px;">${documento}</strong><br />
              es alumno/a regular del <strong>Centro Educativo Educar para Transformar</strong>.
            </p>
            <p style="font-size: 16px; margin-top: 20px;">
              A pedido del interesado y para ser presentado ante las autoridades que correspondan, se expide el presente certificado.
            </p>
            <div style="margin-top: 80px; display: flex; justify-content: space-around;">
              <div style="border-top: 1px solid #333; padding-top: 10px; width: 250px;">
                <p style="margin: 0;">Secretaría Académica</p>
              </div>
              <div style="border-top: 1px solid #333; padding-top: 10px; width: 250px;">
                <p style="margin: 0;">Dirección</p>
              </div>
            </div>
            <p style="margin-top: 60px; font-size: 12px; color: #777;">
              Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}
            </p>
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Error', 'No se puede compartir o descargar en este dispositivo.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al generar el certificado.');
      console.error(error);
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

          <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <Text className="font-black text-slate-800 uppercase text-xs tracking-wider mb-4">Certificado de Alumno Regular</Text>
            <Text className="text-slate-500 text-xs mb-4">
              Ingresá tu documento o legajo para generar y descargar tu certificado en formato PDF.
            </Text>
            <View className="flex-col md:flex-row gap-4">
              <TextInput
                className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200"
                placeholder="N° de Documento o Legajo"
                value={documento}
                onChangeText={setDocumento}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={handleGenerateCertificate}
                className="bg-blue-900 px-6 py-4 rounded-xl justify-center items-center shadow-lg"
              >
                <Text className="text-white font-black uppercase text-[10px] tracking-widest">Generar PDF</Text>
              </TouchableOpacity>
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
