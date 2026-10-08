import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  TaskDetailScreen,
  TaskFiltersScreen,
  TaskListScreen,
} from '../../features/tasks';
import type { TasksStackParamList } from '../../features/tasks';
import { colors, typography } from '../../shared/theme';

// Al sumar features, el navegador raíz compone sus listas de rutas:
// RootStackParamList = TasksStackParamList & OtraFeatureStackParamList.
export type RootStackParamList = TasksStackParamList;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="TaskList"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: typography.heading.fontSize,
          fontWeight: typography.heading.fontWeight,
        },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ title: 'Mis tareas' }}
      />
      <Stack.Screen
        name="TaskFilters"
        component={TaskFiltersScreen}
        options={{ title: 'Filtrar tareas', presentation: 'modal' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Detalle' }}
      />
    </Stack.Navigator>
  );
}
