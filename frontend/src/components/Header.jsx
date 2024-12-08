import React from 'react';
import { Layout } from 'antd';
import { CodeOutlined, GithubOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

const Header = () => {
  return (
    <AntHeader 
      style={{ 
        background: '#fff', 
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '12px'
      }}>
        <CodeOutlined style={{ 
          fontSize: '24px', 
          color: '#1890ff' 
        }} />
        <h1 style={{ 
          margin: 0,
          color: '#1890ff',
          fontSize: '20px',
          fontWeight: 600,
        }}>
          VisionaryLens
        </h1>
      </div>
      
      <a 
        href="https://github.com/civilix/VisionaryLens" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          color: '#1890ff',
          fontSize: '24px',
          transition: 'color 0.3s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#40a9ff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#1890ff'}
      >
        <GithubOutlined />
      </a>
    </AntHeader>
  );
};

export default Header; 