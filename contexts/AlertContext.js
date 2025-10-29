import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Cria o Contexto
const AlertContext = createContext();

// 2. Cria o Provedor (Provider) que vai envolver o aplicativo
export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  // Função para mostrar o alerta. Ela recebe título, mensagem e botões.
  const showAlert = useCallback((title, message, buttons) => {
    setAlert({ title, message, buttons });
  }, []);

  // Função para fechar o alerta
  const closeAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      {alert && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            // Permite fechar o modal no Android ao pressionar o botão de voltar
            const defaultButton = alert.buttons?.find(b => b.style === 'cancel');
            if (defaultButton?.onPress) {
              defaultButton.onPress();
            }
            closeAlert();
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{alert.title}</Text>
              <Text style={styles.modalMessage}>{alert.message}</Text>
              <View style={styles.buttonContainer}>
                {alert.buttons?.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'destructive' ? styles.destructiveButton : styles.defaultButton
                    ]}
                    onPress={() => {
                      if (button.onPress) {
                        button.onPress();
                      }
                      closeAlert();
                    }}
                  >
                    <Text style={[
                      styles.buttonText,
                      button.style === 'destructive' ? styles.destructiveButtonText : styles.defaultButtonText
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
}

// 3. Cria um hook customizado para usar o alerta facilmente em qualquer componente
export const useAlert = () => {
  return useContext(AlertContext);
};

// Estilos para o nosso modal de alerta customizado
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#2C2C2C',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: '#E50914',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#888',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultButtonText: {
    color: 'white',
  },
  destructiveButtonText: {
    color: '#AAA',
  },
});
