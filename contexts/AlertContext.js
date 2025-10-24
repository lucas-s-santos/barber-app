import { createContext, useContext, useState } from 'react';
import CustomAlert from '../components/CustomAlert';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (title, message, buttons) => {
    setAlert({
      visible: true,
      title,
      message,
      buttons: buttons.map(btn => ({
        ...btn,
        onPress: () => {
          setAlert({ visible: false }); // Fecha o alerta
          if (btn.onPress) btn.onPress(); // Executa a ação original
        },
      })),
    });
  };

  const onDismiss = () => {
    setAlert({ ...alert, visible: false });
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={onDismiss}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  return useContext(AlertContext);
};
