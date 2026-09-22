import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [nivel, setNivel] = useState('Nivel Inicial');
  const [correoTutor, setCorreoTutor] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [showNivelDropdown, setShowNivelDropdown] = useState(false);
  const [sendingForm, setSendingForm] = useState(false);

  const handleEnviarSolicitud = async () => {
    if (!nombre || !dni || !correoTutor) {
      Alert.alert('Error', 'Por favor completá los campos obligatorios (Nombre, DNI, Correo).');
      return;
    }

    setSendingForm(true);
    
    const { error } = await supabase
      .from('solicitudes_vacante')
      .insert([
        { nombre_completo: nombre, dni, nivel, correo_tutor: correoTutor, mensaje }
      ]);
      
    setSendingForm(false);

    if (error) {
      Alert.alert('Error', 'Hubo un problema al enviar la solicitud. Inténtalo más tarde.');
      console.error(error);
    } else {
      Alert.alert('Éxito', 'Tu solicitud ha sido enviada correctamente.');
      setNombre('');
      setDni('');
      setCorreoTutor('');
      setMensaje('');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresá tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Credenciales inválidas o error de red.');
    } else {
      setModalVisible(false);
      router.push('/dashboard');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        
        {/* HEADER */}
        <View className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <View className="bg-blue-900 py-2 px-6 hidden md:flex items-center">
            <Text className="text-white text-[10px] font-bold uppercase tracking-widest text-center">
              Excelencia Educativa en Resistencia, Chaco - Inscripciones Ciclo Lectivo 2027 Abiertas
            </Text>
          </View>
          <View className="container mx-auto px-4 py-4 flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-900 rounded-lg items-center justify-center shadow-lg">
                <Text className="text-white font-bold">🎓</Text>
              </View>
              <View>
                <Text className="font-black text-blue-900 uppercase leading-none">Educar para</Text>
                <Text className="font-black text-blue-900 uppercase leading-none">Transformar</Text>
                <Text className="text-[9px] text-orange-600 font-bold uppercase tracking-tighter">Centro Educativo</Text>
              </View>
            </View>

            <View className="hidden lg:flex flex-row gap-6">
              <Text className="text-[11px] font-black uppercase text-slate-500 hover:text-blue-900">Inicio</Text>
              <Text className="text-[11px] font-black uppercase text-slate-500 hover:text-blue-900">Niveles</Text>
              <Text className="text-[11px] font-black uppercase text-slate-500 hover:text-blue-900">Bienestar</Text>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => setModalVisible(true)}
                className="border-2 border-blue-900 px-4 py-2 rounded-lg"
              >
                <Text className="text-[10px] font-black text-blue-900">ACCESO</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-orange-500 px-4 py-2 rounded-lg shadow-lg">
                <Text className="text-[10px] font-black text-white">INSCRIPCIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* HERO SECTION */}
        <View className="px-4 mt-6 items-center">
          <View className="w-full max-w-6xl h-[450px] rounded-[2.5rem] overflow-hidden relative shadow-2xl">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1523050853063-91589436026e?auto=format&fit=crop&w=1200' }} 
              className="absolute w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute w-full h-full bg-blue-900/40" />
            <View className="flex-1 justify-center px-12">
              <View className="max-w-xl">
                <Text className="text-4xl md:text-6xl font-black mb-4 uppercase text-white">
                  Inspiramos, desafiamos y empoderamos
                </Text>
                <Text className="mb-8 opacity-90 text-white text-base">
                  A ser miembros comprometidos y éticos de una comunidad global con excelencia académica.
                </Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity className="bg-blue-900 px-6 py-3 rounded-xl">
                    <Text className="font-bold uppercase text-xs text-white">Conocé Más</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-white px-6 py-3 rounded-xl">
                    <Text className="font-bold uppercase text-xs text-blue-900">Solicitar Vacante</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* NIVELES EDUCATIVOS */}
        <View className="px-4 py-20 mt-8 max-w-7xl mx-auto w-full">
          <View className="flex-row items-center gap-4 mb-12">
            <View className="w-12 h-1 bg-orange-500" />
            <Text className="text-2xl font-black text-blue-900 uppercase">Niveles Educativos</Text>
          </View>
          
          <View className="flex-col md:flex-row gap-8">
            <View className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-green-500 flex-1">
              <Text className="text-4xl mb-6">🧸</Text>
              <Text className="text-xl font-black mb-4 text-slate-800">INICIAL</Text>
              <Text className="text-sm text-slate-500 mb-6">
                Estimulación temprana y aprendizaje en un ambiente seguro y afectivo bajo metodologías lúdicas.
              </Text>
              <TouchableOpacity className="w-full py-3 rounded-xl border-2 border-slate-100">
                <Text className="text-center font-black text-[10px] uppercase text-green-500">Ver Más</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-blue-500 flex-1">
              <Text className="text-4xl mb-6">📚</Text>
              <Text className="text-xl font-black mb-4 text-slate-800">PRIMARIO</Text>
              <Text className="text-sm text-slate-500 mb-6">
                Formación integral con énfasis en valores, conocimiento lógico-matemático y lectocomprensión.
              </Text>
              <TouchableOpacity className="w-full py-3 rounded-xl border-2 border-slate-100">
                <Text className="text-center font-black text-[10px] uppercase text-blue-500">Ver Más</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white p-8 rounded-3xl shadow-xl border-b-4 border-purple-500 flex-1">
              <Text className="text-4xl mb-6">🎓</Text>
              <Text className="text-xl font-black mb-4 text-slate-800">SECUNDARIO</Text>
              <Text className="text-sm text-slate-500 mb-6">
                Preparación académica rigurosa para los desafíos de la universidad y el mundo laboral.
              </Text>
              <TouchableOpacity className="w-full py-3 rounded-xl border-2 border-slate-100">
                <Text className="text-center font-black text-[10px] uppercase text-purple-500">Ver Más</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BIENESTAR ESTUDIANTIL */}
        <View className="bg-slate-100 py-20">
          <View className="px-4 max-w-7xl mx-auto w-full">
            <Text className="text-2xl font-black text-blue-900 uppercase mb-12 text-center">
              Bienestar Estudiantil
            </Text>
            <View className="flex-row flex-wrap justify-center gap-4">
              {[
                { icon: '⚽', label: 'Deportes' },
                { icon: '🗣️', label: 'Idiomas' },
                { icon: '🍽️', label: 'Comedor' },
                { icon: '⚕️', label: 'Enfermería' },
                { icon: '🔬', label: 'Laboratorio' },
                { icon: '❤️', label: 'Apoyo' }
              ].map((item, index) => (
                <View key={index} className="bg-white p-6 rounded-2xl shadow-sm items-center w-32 border-2 border-transparent">
                  <Text className="text-2xl mb-3">{item.icon}</Text>
                  <Text className="text-[10px] font-black uppercase text-slate-800">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* OPINIONES */}
        <View className="px-4 py-20 max-w-7xl mx-auto w-full">
          <Text className="text-2xl font-black text-blue-900 uppercase mb-12">Lo que dicen las Familias</Text>
          <View className="flex-col md:flex-row gap-8">
            <View className="bg-white p-8 rounded-3xl shadow-lg flex-1">
              <Text className="text-yellow-400 mb-4">⭐⭐⭐⭐⭐</Text>
              <Text className="italic text-slate-600 text-sm mb-4">
                "Excelente institución, con un equipo humano comprometido y maravillosas instalaciones."
              </Text>
              <Text className="font-black text-blue-900 uppercase text-xs">María López - Madre de Primaria</Text>
            </View>
            <View className="bg-white p-8 rounded-3xl shadow-lg flex-1">
              <Text className="text-yellow-400 mb-4">⭐⭐⭐⭐</Text>
              <Text className="italic text-slate-600 text-sm mb-4">
                "Mis hijos están felices y motivados cada día. La propuesta de robótica es increíble."
              </Text>
              <Text className="font-black text-blue-900 uppercase text-xs">Juan Pérez - Padre de Secundaria</Text>
            </View>
            <View className="bg-white p-8 rounded-3xl shadow-lg flex-1">
              <Text className="text-yellow-400 mb-4">⭐⭐⭐⭐⭐</Text>
              <Text className="italic text-slate-600 text-sm mb-4">
                "Una educación de calidad que realmente prepara para los desafíos del mundo actual."
              </Text>
              <Text className="font-black text-blue-900 uppercase text-xs">Ana Gómez - Madre de Inicial</Text>
            </View>
          </View>
        </View>

        {/* CONTACTO */}
        <View className="bg-blue-900 py-20">
          <View className="px-4 max-w-7xl mx-auto w-full flex-col md:flex-row gap-16">
            <View className="flex-1">
              <Text className="text-3xl font-black uppercase mb-6 text-white">Proceso de Admisión 2027</Text>
              <Text className="opacity-80 mb-8 text-white">
                Completá el formulario y nuestro equipo de admisiones te contactará para agendar una visita personalizada a nuestras instalaciones.
              </Text>
              <View className="gap-4">
                <Text className="text-white">📞 (362) 123 4567</Text>
                <Text className="text-white">✉️ info@educarparatransformar.edu.ar</Text>
                <Text className="text-white">🕒 Lunes a Viernes: 07:30 a 17:30 hs</Text>
              </View>
            </View>
            <View className="bg-white p-8 rounded-3xl flex-1 gap-4 z-10">
              <TextInput 
                placeholder="Nombre completo"
                value={nombre}
                onChangeText={setNombre}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700"
                placeholderTextColor="#94a3b8"
              />
              <View className="flex-row gap-4 z-50">
                <TextInput 
                  placeholder="DNI"
                  value={dni}
                  onChangeText={setDni}
                  keyboardType="numeric"
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700"
                  placeholderTextColor="#94a3b8"
                />
                
                <View className="flex-1 relative">
                  <TouchableOpacity 
                    onPress={() => setShowNivelDropdown(!showNivelDropdown)}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex-row justify-between items-center"
                  >
                    <Text className="text-slate-700">{nivel}</Text>
                    <Text className="text-slate-400 text-xs">▼</Text>
                  </TouchableOpacity>
                  
                  {showNivelDropdown && (
                    <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                      {['Nivel Inicial', 'Nivel Primario', 'Nivel Secundario'].map((opcion) => (
                        <TouchableOpacity
                          key={opcion}
                          className={`px-4 py-3 ${nivel === opcion ? 'bg-slate-200' : 'bg-white'} hover:bg-slate-50`}
                          onPress={() => {
                            setNivel(opcion);
                            setShowNivelDropdown(false);
                          }}
                        >
                          <Text className="text-slate-700">{opcion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              
              <TextInput 
                placeholder="Correo electrónico del tutor"
                value={correoTutor}
                onChangeText={setCorreoTutor}
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700"
                placeholderTextColor="#94a3b8"
              />
              
              <TextInput 
                placeholder="Mensaje o consulta adicional"
                value={mensaje}
                onChangeText={setMensaje}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity 
                onPress={handleEnviarSolicitud}
                disabled={sendingForm}
                className="w-full bg-orange-500 py-4 rounded-xl shadow-lg mt-2 flex-row justify-center items-center"
              >
                {sendingForm ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-black uppercase text-xs tracking-widest">Enviar Solicitud de Vacante</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* MODAL DE LOGIN */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative">
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              className="absolute top-6 right-6"
            >
              <Text className="text-xl text-slate-400">✕</Text>
            </TouchableOpacity>
            
            <Text className="text-xl font-black text-blue-900 uppercase mb-6 text-center">
              Acceso al Campus
            </Text>
            
            <View className="gap-4">
              <TextInput 
                placeholder="Usuario o email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                className="w-full p-4 bg-slate-100 rounded-xl"
              />
              <TextInput 
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="w-full p-4 bg-slate-100 rounded-xl"
              />
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading}
                className="w-full bg-blue-900 py-4 rounded-xl flex-row justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black uppercase text-xs tracking-widest">
                    Ingresar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
