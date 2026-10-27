import '../global.css';
import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <Slot />
      </ScrollView>
    </SafeAreaView>
  );
}
