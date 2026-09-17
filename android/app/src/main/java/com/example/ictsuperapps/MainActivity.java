package com.example.ictsuperapps;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(MacOcrPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
