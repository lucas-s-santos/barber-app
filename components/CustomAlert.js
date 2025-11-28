import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CustomAlert = ({ visible, title, message, buttons, onDismiss }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.header}>
            {title === 'Sucesso!' && (
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#34D399"
                style={styles.icon}
              />
            )}
            {title === 'Erro' && (
              <Ionicons name="close-circle-outline" size={24} color="#E50914" style={styles.icon} />
            )}
            {title === 'Confirmar Cancelamento' && (
              <Ionicons name="warning-outline" size={24} color="#f59e0b" style={styles.icon} />
            )}
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' ? styles.destructiveButton : {},
                  button.style === 'cancel' ? styles.cancelButton : {},
                  buttons.length === 1 ? styles.fullWidthButton : {},
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' ? styles.destructiveButtonText : {},
                    button.style === 'cancel' ? styles.cancelButtonText : {},
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  message: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: '#34D399', // Estilo padrão (OK, Confirmar)
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  destructiveButton: {
    backgroundColor: '#E50914',
  },
  destructiveButtonText: {
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#4B5563',
  },
  cancelButtonText: {
    color: 'white',
  },
  fullWidthButton: {
    flex: 1, // Faz o botão ocupar todo o espaço se for o único
  },
});

export default CustomAlert;
