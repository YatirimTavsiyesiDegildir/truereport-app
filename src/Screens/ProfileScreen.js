import React from 'react';
import {Button, Layout, Modal, Text} from '@ui-kitten/components';
import {NotReadyModal} from '../Components/NotReadyModal';

export default function ProfileScreen() {
  const [visible, setVisible] = React.useState(false);

  return (
    <Layout style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{textAlign: 'center'}} category="h2">
        Güzelim hatunlar ve yakuşuklu beyler ile konuşmak için sen de hemen bir
        hesap aç!
      </Text>
      <Button
        size="giant"
        style={{padding: 5, marginTop: 40}}
        onPress={() => setVisible(true)}>
        HESAP AÇ
      </Button>
      {NotReadyModal(visible, () => setVisible(false))}
    </Layout>
  );
}