import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';

interface FormModalProps {
  visible: boolean;
  children: React.ReactNode;
}

export function FormModal({ visible, children }: FormModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl w-full" style={{ maxHeight: '94%' }}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
